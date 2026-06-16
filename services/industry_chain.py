import json
import logging
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import networkx as nx


logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[1]
CHAINS_FILE = PROJECT_ROOT / "chains.json"
MISSING_NODE_TYPE = "缺失"
EXISTING_NODE_TYPE = "已有"

FALLBACK_CHAINS: Dict[str, Any] = {
    "chains": [
        {
            "name": "光芯屏端网",
            "industry": "新一代信息技术",
            "nodes": [
                {"id": "optical_materials", "name": "光电子材料", "type": EXISTING_NODE_TYPE, "industry": "新一代信息技术"},
                {"id": "laser_chips", "name": "激光器芯片", "type": EXISTING_NODE_TYPE, "industry": "新一代信息技术"},
                {
                    "id": "silicon_photonics_packaging",
                    "name": "硅光先进封装",
                    "type": MISSING_NODE_TYPE,
                    "industry": "新一代信息技术",
                },
                {"id": "optical_modules", "name": "高速光模块", "type": EXISTING_NODE_TYPE, "industry": "新一代信息技术"},
                {"id": "edge_ai_gateway", "name": "边缘AI网关", "type": MISSING_NODE_TYPE, "industry": "新一代信息技术"},
            ],
            "edges": [
                {"source": "optical_materials", "target": "laser_chips"},
                {"source": "laser_chips", "target": "silicon_photonics_packaging"},
                {"source": "silicon_photonics_packaging", "target": "optical_modules"},
                {"source": "optical_modules", "target": "edge_ai_gateway"},
            ],
        }
    ]
}


def _load_chain_data() -> Dict[str, Any]:
    """Load industry-chain graph data from JSON or fallback data."""
    if not CHAINS_FILE.exists():
        logger.warning("Industry chain data file not found: %s. Using fallback data.", CHAINS_FILE)
        return FALLBACK_CHAINS

    try:
        with CHAINS_FILE.open("r", encoding="utf-8") as file:
            payload = json.load(file)
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Failed to load industry chain data file %s: %s. Using fallback data.", CHAINS_FILE, exc)
        return FALLBACK_CHAINS

    if not isinstance(payload, dict) or not isinstance(payload.get("chains"), list):
        logger.warning("Industry chain data file has invalid schema. Using fallback data.")
        return FALLBACK_CHAINS
    return payload


def _build_graph(chain_data: Dict[str, Any]) -> nx.DiGraph:
    """Build a directed industry-chain graph from structured data."""
    graph = nx.DiGraph()
    for chain in chain_data.get("chains", []):
        if not isinstance(chain, dict):
            continue
        chain_name = str(chain.get("name") or "")
        chain_industry = str(chain.get("industry") or "")

        for node in chain.get("nodes", []):
            if not isinstance(node, dict) or not node.get("id"):
                continue
            node_id = str(node["id"])
            graph.add_node(
                node_id,
                name=str(node.get("name") or node_id),
                type=str(node.get("type") or EXISTING_NODE_TYPE),
                industry=str(node.get("industry") or chain_industry),
                chain_name=chain_name,
            )

        for edge in chain.get("edges", []):
            if not isinstance(edge, dict):
                continue
            source = edge.get("source")
            target = edge.get("target")
            if source in graph and target in graph:
                graph.add_edge(str(source), str(target), chain_name=chain_name)

    return graph


def _normalize_text(value: str) -> str:
    """Normalize text for lightweight fuzzy matching."""
    return value.strip().lower().replace(" ", "")


def _token_similarity(query: str, candidate: str) -> float:
    """Calculate a simple character-overlap similarity score."""
    query_text = _normalize_text(query)
    candidate_text = _normalize_text(candidate)
    if not query_text or not candidate_text:
        return 0.0
    if query_text == candidate_text:
        return 1.0
    if query_text in candidate_text or candidate_text in query_text:
        return 0.85

    query_chars = set(query_text)
    candidate_chars = set(candidate_text)
    overlap = len(query_chars & candidate_chars)
    union = len(query_chars | candidate_chars)
    return overlap / union if union else 0.0


def _candidate_nodes(graph: nx.DiGraph, node_type: Optional[str] = None) -> Iterable[Tuple[str, Dict[str, Any]]]:
    """Yield graph nodes, optionally filtered by node type."""
    for node_id, attrs in graph.nodes(data=True):
        if node_type and attrs.get("type") != node_type:
            continue
        yield node_id, attrs


def _best_text_match(graph: nx.DiGraph, query: str, node_type: Optional[str] = None) -> Tuple[Optional[str], float]:
    """Find the graph node with the best text similarity to a query."""
    best_node = None
    best_score = 0.0
    for node_id, attrs in _candidate_nodes(graph, node_type=node_type):
        score = max(
            _token_similarity(query, str(attrs.get("name") or "")),
            _token_similarity(query, str(attrs.get("industry") or "")),
        )
        if score > best_score:
            best_node = node_id
            best_score = score
    return best_node, best_score


def _industry_filtered_graph(graph: nx.DiGraph, company_industry: str) -> nx.DiGraph:
    """Return a subgraph scoped to a likely matching industry."""
    if not company_industry.strip():
        return graph

    matched_nodes = [
        node_id
        for node_id, attrs in graph.nodes(data=True)
        if _token_similarity(company_industry, str(attrs.get("industry") or "")) >= 0.35
        or _token_similarity(company_industry, str(attrs.get("chain_name") or "")) >= 0.35
    ]
    if not matched_nodes:
        return graph
    return graph.subgraph(matched_nodes).copy()


def _nearest_missing_node(graph: nx.DiGraph, source_node: str) -> Tuple[Optional[str], float]:
    """Find the nearest missing node from a source node by graph distance."""
    undirected = graph.to_undirected()
    best_node = None
    best_score = 0.0
    for node_id, attrs in _candidate_nodes(graph, node_type=MISSING_NODE_TYPE):
        try:
            distance = nx.shortest_path_length(undirected, source=source_node, target=node_id)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            continue
        if distance == 0:
            score = 1.0
        else:
            score = 1 / (1 + float(distance))
        if score > best_score:
            best_node = node_id
            best_score = score
    return best_node, best_score


def _closest_chain_suggestion(graph: nx.DiGraph, company_industry: str, company_sub_sector: str) -> Tuple[str, str]:
    """Return the closest chain-level suggestion when no node matches."""
    query = f"{company_industry}{company_sub_sector}"
    chain_scores: Dict[str, float] = {}
    for _, attrs in graph.nodes(data=True):
        chain_name = str(attrs.get("chain_name") or "")
        if not chain_name:
            continue
        score = max(
            _token_similarity(query, chain_name),
            _token_similarity(company_industry, str(attrs.get("industry") or "")),
            _token_similarity(company_sub_sector, str(attrs.get("name") or "")),
        )
        chain_scores[chain_name] = max(chain_scores.get(chain_name, 0.0), score)

    if not chain_scores:
        return "", "建议补充产业链 JSON 数据后重新匹配"

    chain_name = max(chain_scores.items(), key=lambda item: item[1])[0]
    return chain_name, f"建议优先核对“{chain_name}”产业链的缺失环节清单"


def _suggested_actions(graph: nx.DiGraph, matched_node: str) -> List[str]:
    """Build action suggestions around a matched missing node."""
    node_name = str(graph.nodes[matched_node].get("name") or matched_node)
    predecessors = [str(graph.nodes[node].get("name") or node) for node in graph.predecessors(matched_node)]
    successors = [str(graph.nodes[node].get("name") or node) for node in graph.successors(matched_node)]

    actions = [f"引入可补齐节点{node_name}"]
    if predecessors:
        actions.append(f"对接上游环节：{'、'.join(predecessors[:3])}")
    if successors:
        actions.append(f"联动下游应用：{'、'.join(successors[:3])}")
    return actions


def match_chain(company_industry: str, company_sub_sector: str) -> Dict[str, Any]:
    """Match a company sector to the closest missing node in Optics Valley chains.

    The graph is loaded from ``chains.json`` when available. If the file is
    missing or invalid, the function falls back to a built-in example graph for
    the ``光芯屏端网`` chain. Exact sub-sector matches against missing nodes score
    ``1.0``. Existing-node matches search upstream and downstream paths to the
    nearest missing node and score by graph distance.
    """
    graph = _build_graph(_load_chain_data())
    if graph.number_of_nodes() == 0:
        return {
            "matched_node": "",
            "match_score": 0.0,
            "chain_name": "",
            "suggested_actions": ["建议补充光谷六大产业链节点与边数据"],
        }

    scoped_graph = _industry_filtered_graph(graph, company_industry)

    exact_missing_node, exact_score = _best_text_match(scoped_graph, company_sub_sector, node_type=MISSING_NODE_TYPE)
    if exact_missing_node and exact_score >= 0.85:
        attrs = scoped_graph.nodes[exact_missing_node]
        return {
            "matched_node": str(attrs.get("name") or exact_missing_node),
            "match_score": 1.0,
            "chain_name": str(attrs.get("chain_name") or ""),
            "suggested_actions": _suggested_actions(scoped_graph, exact_missing_node),
        }

    source_node, source_score = _best_text_match(scoped_graph, company_sub_sector)
    if source_node and source_score >= 0.25:
        missing_node, distance_score = _nearest_missing_node(scoped_graph, source_node)
        if missing_node:
            attrs = scoped_graph.nodes[missing_node]
            match_score = round(min(1.0, max(0.0, source_score * 0.55 + distance_score * 0.45)), 4)
            return {
                "matched_node": str(attrs.get("name") or missing_node),
                "match_score": match_score,
                "chain_name": str(attrs.get("chain_name") or ""),
                "suggested_actions": _suggested_actions(scoped_graph, missing_node),
            }

    chain_name, suggestion = _closest_chain_suggestion(graph, company_industry, company_sub_sector)
    return {
        "matched_node": "",
        "match_score": 0.0,
        "chain_name": chain_name,
        "suggested_actions": [suggestion],
    }
