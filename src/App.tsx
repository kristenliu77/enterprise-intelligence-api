import { BrowserRouter } from "react-router-dom";
import AppRouter from "./router";
import "./styles/app.css";

export default function App(): JSX.Element {
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
