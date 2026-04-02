import MagnetLines from './MagnetLines';

import './MagnetBackground.css';

export default function MagnetBackground() {
  return (
    <div className="magnet-background" aria-hidden="true">
      <div className="magnet-background__pattern" />
      <div className="magnet-background__glow magnet-background__glow--mint" />
      <div className="magnet-background__glow magnet-background__glow--peach" />
      <div className="magnet-background__glow magnet-background__glow--azure" />

      <MagnetLines
        rows={14}
        columns={18}
        containerSize="max(110vw, 84rem)"
        lineColor="rgba(29, 52, 68, 0.1)"
        lineWidth="2px"
        lineHeight="36px"
        baseAngle={-12}
        className="magnet-background__field magnet-background__field--primary"
      />

      <MagnetLines
        rows={9}
        columns={12}
        containerSize="min(58vw, 34rem)"
        lineColor="rgba(255, 138, 106, 0.16)"
        lineWidth="2px"
        lineHeight="24px"
        baseAngle={12}
        className="magnet-background__field magnet-background__field--secondary"
      />

      <MagnetLines
        rows={9}
        columns={12}
        containerSize="min(62vw, 38rem)"
        lineColor="rgba(82, 159, 255, 0.14)"
        lineWidth="2px"
        lineHeight="28px"
        baseAngle={4}
        className="magnet-background__field magnet-background__field--tertiary"
      />

      <MagnetLines
        rows={8}
        columns={10}
        containerSize="min(48vw, 30rem)"
        lineColor="rgba(16, 32, 45, 0.08)"
        lineWidth="2px"
        lineHeight="22px"
        baseAngle={-18}
        className="magnet-background__field magnet-background__field--quaternary"
      />
    </div>
  );
}
