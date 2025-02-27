import { useState } from "react";
import Timer from "./Componentes/Timer/Timer";

function App() {
  const [minutes, setMinutes] = useState(0);

  return (
    <>
      <Timer minutes={minutes} />
    </>
  );
}

export default App;
