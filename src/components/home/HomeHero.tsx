import { homeContent } from "@/lib/home-content";
import { baseCaseExpectedText } from "@/lib/mock-data";

export function HomeHero() {
  return (
    <section className="hero-lite">
      <h1>{homeContent.hero.title}</h1>
      <p>
        {homeContent.hero.introPrefix} <code>{baseCaseExpectedText.startRoute}</code> {homeContent.hero.introMiddle}{" "}
        <code>F={baseCaseExpectedText.startCost}</code>. {homeContent.hero.introSuffix}{" "}
        <code>{baseCaseExpectedText.bestLocalRoute}</code> {homeContent.hero.introEnd}{" "}
        <code>F={baseCaseExpectedText.bestLocalCost}</code>.
      </p>
      <p>{homeContent.hero.algorithmExplanation}</p>
    </section>
  );
}
