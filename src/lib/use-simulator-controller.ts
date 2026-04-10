import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  clonarGrafo,
  escalarColina,
  esRutaValida,
  obtenerCostoArista,
  parsearRuta,
  rutaATexto,
} from "@/lib/hill-climbing";
import { preajustes } from "@/lib/mock-data";
import {
  POSICIONES_BASE,
  agregarOActualizarArista,
  eliminarNodo,
  formatearRutaPorDefecto,
  siguienteIdNodo,
  type Punto,
} from "@/lib/simulator-helpers";
import type { GrafoPonderado, ResultadoEscalada, Ruta } from "@/lib/types";
import type { ModoEditor } from "@/components/graph/GraphCanvas";

export type FuenteEscenario = "example" | "custom";
const MAXIMO_INTERNO_ITERACIONES = 1000;

function esRutaConsecutivaValida(ruta: Ruta, grafo: GrafoPonderado): boolean {
  for (let i = 0; i < ruta.length - 1; i += 1) {
    const costo = obtenerCostoArista(grafo, ruta[i], ruta[i + 1]);
    if (!Number.isFinite(costo)) return false;
  }
  return true;
}

function encontrarRutaAutomaticaValida(grafo: GrafoPonderado): Ruta | null {
  if (grafo.nodes.length === 0) return null;
  if (grafo.nodes.length === 1) return [...grafo.nodes];

  const nodosOrdenados = [...grafo.nodes].sort((a, b) => a - b);
  if (esRutaConsecutivaValida(nodosOrdenados, grafo)) return nodosOrdenados;

  const limiteBacktracking = 9;
  if (nodosOrdenados.length > limiteBacktracking) return null;

  const totalNodos = nodosOrdenados.length;
  const nodosUsados = new Set<number>();
  const rutaParcial: number[] = [];

  const buscar = (actual: number): boolean => {
    rutaParcial.push(actual);
    nodosUsados.add(actual);

    if (rutaParcial.length === totalNodos) return true;

    for (const siguiente of nodosOrdenados) {
      if (nodosUsados.has(siguiente)) continue;
      const costo = obtenerCostoArista(grafo, actual, siguiente);
      if (!Number.isFinite(costo)) continue;
      if (buscar(siguiente)) return true;
    }

    nodosUsados.delete(actual);
    rutaParcial.pop();
    return false;
  };

  for (const inicio of nodosOrdenados) {
    rutaParcial.length = 0;
    nodosUsados.clear();
    if (buscar(inicio)) return [...rutaParcial];
  }

  return null;
}

export function useControladorSimulador() {
  const [grafo, setGrafo] = useState<GrafoPonderado>({ nodes: [], edges: [] });
  const [posiciones, setPosiciones] = useState<Record<number, Punto>>({});
  const [etiquetas, setEtiquetas] = useState<Record<number, string>>({});
  const [modoEditor, setModoEditor] = useState<ModoEditor>("select");
  const [idNodoSeleccionado, setIdNodoSeleccionado] = useState<number | null>(null);
  const [idNodoOrigenPendiente, setIdNodoOrigenPendiente] = useState<number | null>(null);
  const [idNodoArrastrando, setIdNodoArrastrando] = useState<number | null>(null);
  const [dialogoNodoAbierto, setDialogoNodoAbierto] = useState(false);
  const [entradaNombreNodo, setEntradaNombreNodo] = useState("");
  const [posicionNodoPendiente, setPosicionNodoPendiente] = useState<Punto | null>(null);
  const [modoEtiquetaNodo, setModoEtiquetaNodo] = useState<"numeric" | "city">("numeric");

  const [entradaRuta, setEntradaRuta] = useState("");
  const [entradaMaxIteraciones, setEntradaMaxIteraciones] = useState("30");
  const [resultado, setResultado] = useState<ResultadoEscalada | null>(null);
  const [iteracionSeleccionada, setIteracionSeleccionada] = useState(1);
  const [fuenteEscenario, setFuenteEscenario] = useState<FuenteEscenario>("custom");
  const [fuenteUltimaEjecucion, setFuenteUltimaEjecucion] = useState<FuenteEscenario | null>(null);

  const [dialogoAristaAbierto, setDialogoAristaAbierto] = useState(false);
  const [objetivoDialogoArista, setObjetivoDialogoArista] = useState<number | null>(null);
  const [entradaPesoArista, setEntradaPesoArista] = useState("100");
  const [aristaBidireccional, setAristaBidireccional] = useState(true);

  const iteracionActiva =
    resultado?.iterations.find((iteracion) => iteracion.iteration === iteracionSeleccionada) ?? null;
  const rutaActiva = iteracionActiva?.currentRoute ?? resultado?.solutionRoute;

  const vistaPreviaRutaAutomatica = useMemo(() => {
    const ruta = encontrarRutaAutomaticaValida(grafo);
    return ruta ? formatearRutaPorDefecto(ruta) : "";
  }, [grafo]);

  const serieCostos = useMemo(() => {
    if (!resultado) return [];
    const valores = [resultado.startCost];
    resultado.iterations.forEach((iteracion) => {
      if (iteracion.moved) valores.push(iteracion.bestNeighbor.cost);
    });
    return valores;
  }, [resultado]);

  const hayNodosNumericos = useMemo(
    () => grafo.nodes.some((nodo) => etiquetas[nodo] === String(nodo)),
    [grafo.nodes, etiquetas],
  );

  const fijarModoEditor = (siguienteModo: ModoEditor) => {
    setModoEditor(siguienteModo);
    if (siguienteModo !== "add-edge") setIdNodoOrigenPendiente(null);
    if (siguienteModo !== "select") setIdNodoSeleccionado(null);
  };

  const manejarClicEnLienzo = (x: number, y: number) => {
    if (modoEditor === "add-node") {
      if (modoEtiquetaNodo === "city") {
        setPosicionNodoPendiente({ x, y });
        setEntradaNombreNodo("");
        setDialogoNodoAbierto(true);
        return;
      }

      const idNodo = siguienteIdNodo(grafo.nodes);
      const nuevaRuta = [...grafo.nodes, idNodo];
      setGrafo((previo) => ({ ...previo, nodes: [...previo.nodes, idNodo] }));
      setPosiciones((previo) => ({ ...previo, [idNodo]: { x, y } }));
      setEtiquetas((previo) => ({ ...previo, [idNodo]: String(idNodo) }));
      setFuenteEscenario("custom");
      if (!entradaRuta) setEntradaRuta(formatearRutaPorDefecto(nuevaRuta));
      toast.success(`Nodo ${idNodo} agregado.`);
      return;
    }

    if (modoEditor === "select") {
      setIdNodoSeleccionado(null);
    }
  };

  const manejarClicEnNodo = (idNodo: number) => {
    if (modoEditor === "delete") {
      setGrafo((previo) => eliminarNodo(previo, idNodo));
      setPosiciones((previo) => {
        const siguiente = { ...previo };
        delete siguiente[idNodo];
        return siguiente;
      });
      setEtiquetas((previo) => {
        const siguiente = { ...previo };
        delete siguiente[idNodo];
        return siguiente;
      });
      setFuenteEscenario("custom");
      if (idNodoSeleccionado === idNodo) setIdNodoSeleccionado(null);
      toast.success(`Nodo ${idNodo} eliminado.`);
      return;
    }

    if (modoEditor === "add-edge") {
      if (idNodoOrigenPendiente === null) {
        setIdNodoOrigenPendiente(idNodo);
        toast.info(`Nodo origen: ${idNodo}. Ahora elige un nodo destino.`);
        return;
      }

      if (idNodoOrigenPendiente === idNodo) {
        toast.error("Selecciona un nodo destino distinto.");
        return;
      }

      setObjetivoDialogoArista(idNodo);
      setDialogoAristaAbierto(true);
      return;
    }

    setIdNodoSeleccionado(idNodo);
  };

  const manejarClicEnArista = (idArista: string) => {
    if (modoEditor !== "delete") return;
    setGrafo((previo) => ({
      ...previo,
      edges: previo.edges.filter((arista) => arista.id !== idArista),
    }));
    toast.success("Conexión eliminada.");
  };

  const confirmarCreacionArista = () => {
    if (idNodoOrigenPendiente === null || objetivoDialogoArista === null) {
      setDialogoAristaAbierto(false);
      return false;
    }

    const pesoNormalizado = entradaPesoArista.trim();
    if (!pesoNormalizado) {
      toast.error("El peso es obligatorio.");
      return false;
    }

    const pesoParseado = Number(pesoNormalizado);
    if (!Number.isFinite(pesoParseado) || pesoParseado <= 0) {
      toast.error("El peso debe ser un número mayor que 0.");
      return false;
    }

    const peso = Math.floor(pesoParseado);
    setGrafo((previo) =>
      agregarOActualizarArista(previo, idNodoOrigenPendiente, objetivoDialogoArista, peso, aristaBidireccional),
    );
    setFuenteEscenario("custom");
    setDialogoAristaAbierto(false);
    setIdNodoOrigenPendiente(null);
    setObjetivoDialogoArista(null);
    setEntradaPesoArista("100");
    setAristaBidireccional(true);
    toast.success("Conexión creada.");
    return true;
  };

  const confirmarCreacionNodo = () => {
    if (!posicionNodoPendiente) {
      setDialogoNodoAbierto(false);
      return false;
    }

    const nombre = entradaNombreNodo.trim();
    if (!nombre) {
      toast.error("El nombre de la ciudad es obligatorio.");
      return false;
    }

    const idNodo = siguienteIdNodo(grafo.nodes);
    const nuevaRuta = [...grafo.nodes, idNodo];
    setGrafo((previo) => ({ ...previo, nodes: [...previo.nodes, idNodo] }));
    setPosiciones((previo) => ({ ...previo, [idNodo]: posicionNodoPendiente }));
    setEtiquetas((previo) => ({ ...previo, [idNodo]: nombre }));
    setFuenteEscenario("custom");
    if (!entradaRuta) setEntradaRuta(formatearRutaPorDefecto(nuevaRuta));
    setDialogoNodoAbierto(false);
    setPosicionNodoPendiente(null);
    toast.success(`Nodo "${nombre}" agregado.`);
    return true;
  };

  const manejarCambioDialogoNodo = (abierto: boolean) => {
    setDialogoNodoAbierto(abierto);
    if (!abierto) {
      setPosicionNodoPendiente(null);
      setEntradaNombreNodo("");
    }
  };

  const manejarCambioDialogoArista = (abierto: boolean) => {
    setDialogoAristaAbierto(abierto);
    if (!abierto) {
      setObjetivoDialogoArista(null);
      setIdNodoOrigenPendiente(null);
    }
  };

  const ejecutarConRuta = (textoRuta?: string) => {
    if (grafo.nodes.length < 2) {
      toast.error("Agrega al menos 2 nodos para ejecutar el algoritmo.");
      return;
    }

    const origenTextoRuta = textoRuta ?? entradaRuta;
    const ruta = parsearRuta(origenTextoRuta);
    if (!esRutaValida(ruta, grafo.nodes)) {
      toast.error("Ruta inválida. Debe incluir exactamente todos los nodos del grafo.");
      return;
    }

    for (let i = 0; i < ruta.length - 1; i += 1) {
      const costo = obtenerCostoArista(grafo, ruta[i], ruta[i + 1]);
      if (!Number.isFinite(costo)) {
        toast.error(`No existe conexión entre ${ruta[i]} y ${ruta[i + 1]}.`);
        return;
      }
    }

    const siguiente = escalarColina(grafo, ruta, MAXIMO_INTERNO_ITERACIONES);
    setResultado(siguiente);
    setFuenteUltimaEjecucion(fuenteEscenario);
    setIteracionSeleccionada(1);
    toast.success(`Resultado: ${rutaATexto(siguiente.solutionRoute)} con F=${siguiente.solutionCost}.`);
  };

  const ejecutarAlgoritmo = () => {
    ejecutarConRuta();
  };

  const ejecutarAlgoritmoAuto = () => {
    if (grafo.nodes.length < 2) {
      toast.error("Agrega al menos 2 nodos para ejecutar el algoritmo.");
      return;
    }

    const ruta = encontrarRutaAutomaticaValida(grafo);
    if (!ruta || !esRutaValida(ruta, grafo.nodes)) {
      toast.error("No se pudo generar una ruta válida con las conexiones actuales del grafo.");
      return;
    }

    setEntradaRuta(formatearRutaPorDefecto(ruta));
    const siguiente = escalarColina(grafo, ruta, MAXIMO_INTERNO_ITERACIONES);
    setResultado(siguiente);
    setFuenteUltimaEjecucion(fuenteEscenario);
    setIteracionSeleccionada(1);
    toast.success(`Resultado: ${rutaATexto(siguiente.solutionRoute)} con F=${siguiente.solutionCost}.`);
  };

  const limpiarTodo = () => {
    setGrafo({ nodes: [], edges: [] });
    setPosiciones({});
    setEtiquetas({});
    setModoEditor("select");
    setIdNodoSeleccionado(null);
    setIdNodoOrigenPendiente(null);
    setEntradaRuta("");
    setResultado(null);
    setFuenteEscenario("custom");
    setFuenteUltimaEjecucion(null);
    toast.success("Lienzo limpiado.");
  };

  const cargarCasoBase = () => {
    const preajuste = preajustes.find((item) => item.id === "base") ?? preajustes[0];
    const escenario = clonarGrafo(preajuste.graph);
    const etiquetasIniciales: Record<number, string> = {};
    escenario.nodes.forEach((nodo) => {
      etiquetasIniciales[nodo] = String(nodo);
    });

    setGrafo(escenario);
    setEtiquetas(etiquetasIniciales);
    setPosiciones(POSICIONES_BASE);
    setEntradaRuta(preajuste.defaultRoute.join(","));
    setResultado(escalarColina(escenario, preajuste.defaultRoute, MAXIMO_INTERNO_ITERACIONES));
    setIteracionSeleccionada(1);
    setModoEditor("select");
    setIdNodoOrigenPendiente(null);
    setFuenteEscenario("example");
    setFuenteUltimaEjecucion("example");
    toast.info("Caso base cargado.");
  };

  const aplicarRutaAutomatica = () => {
    const ordenados = [...grafo.nodes].sort((a, b) => a - b);
    setEntradaRuta(formatearRutaPorDefecto(ordenados));
  };

  return {
    grafo,
    posiciones,
    etiquetas,
    modoEditor,
    idNodoSeleccionado,
    idNodoOrigenPendiente,
    idNodoArrastrando,
    entradaRuta,
    entradaMaxIteraciones,
    resultado,
    iteracionSeleccionada,
    fuenteEscenario,
    fuenteUltimaEjecucion,
    dialogoAristaAbierto,
    objetivoDialogoArista,
    entradaPesoArista,
    aristaBidireccional,
    dialogoNodoAbierto,
    entradaNombreNodo,
    posicionNodoPendiente,
    confirmarCreacionNodo,
    manejarCambioDialogoNodo,
    modoEtiquetaNodo,
    setModoEtiquetaNodo,
    hayNodosNumericos,
    rutaActiva,
    vistaPreviaRutaAutomatica,
    serieCostos,
    setEntradaRuta,
    setEntradaMaxIteraciones,
    setIteracionSeleccionada,
    setEntradaPesoArista,
    setEntradaNombreNodo,
    setAristaBidireccional,
    setEtiquetas,
    setIdNodoArrastrando,
    setDialogoAristaAbierto,
    manejarCambioDialogoArista,
    fijarModoEditor,
    manejarClicEnLienzo,
    manejarClicEnNodo,
    manejarClicEnArista,
    confirmarCreacionArista,
    ejecutarAlgoritmo,
    ejecutarConRuta,
    ejecutarAlgoritmoAuto,
    limpiarTodo,
    cargarCasoBase,
    aplicarRutaAutomatica,
    setPosiciones,

  };
}

export const useControladorDelSimulador = useControladorSimulador;
