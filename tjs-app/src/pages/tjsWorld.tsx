import ThreeScene from './ThreeScene';
export default function TjSWorld() {
  return (
    <div>
      <div id="app"></div>
      <div id="info">
        <div id="info-player-position"></div>
      </div>
      <div id="container"></div>
      <ThreeScene />
    </div>
  );
}