import { homeContent } from "@/lib/home-content";
import { textoEsperadoCasoBase } from "@/lib/mock-data";

export function HomeHero() {
  return (
    <section className="hero-lite">
      <h1>{homeContent.hero.title}</h1>
      <p>
        {homeContent.hero.introPrefix} <code>{textoEsperadoCasoBase.rutaInicio}</code> {homeContent.hero.introMiddle}{" "}
        <code>F={textoEsperadoCasoBase.costoInicio}</code>. {homeContent.hero.introSuffix}{" "}
        <code>{textoEsperadoCasoBase.rutaOptimoLocal}</code> {homeContent.hero.introEnd}{" "}
        <code>F={textoEsperadoCasoBase.costoOptimoLocal}</code>.
      </p>
      <p>{homeContent.hero.algorithmExplanation}</p>
    </section>
  );
}
