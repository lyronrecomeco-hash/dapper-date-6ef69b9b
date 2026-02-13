import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Slice {
  id: string;
  label: string;
  icon: string;
  discount_percent: number | null;
  discount_value: number | null;
  custom_prize: string | null;
  probability: number;
}

const COLORS = [
  "hsl(245 60% 50%)", "hsl(280 55% 45%)", "hsl(200 60% 45%)",
  "hsl(160 50% 40%)", "hsl(320 50% 45%)", "hsl(30 60% 50%)",
  "hsl(245 40% 35%)", "hsl(0 55% 45%)",
];

const PrizeWheel = ({ onClose }: { onClose: () => void }) => {
  const [slices, setSlices] = useState<Slice[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Slice | null>(null);
  const [rotation, setRotation] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("prize_wheel_slices").select("*").eq("active", true).order("sort_order");
      if (data && data.length > 0) setSlices(data as Slice[]);
    };
    fetch();
  }, []);

  useEffect(() => {
    if (slices.length === 0) return;
    drawWheel(0);
  }, [slices]);

  const drawWheel = (rot: number) => {
    const canvas = canvasRef.current;
    if (!canvas || slices.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 8;
    const arc = (2 * Math.PI) / slices.length;

    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate((rot * Math.PI) / 180);

    slices.forEach((slice, i) => {
      const angle = i * arc;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, angle, angle + arc);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "hsl(0 0% 100% / 0.1)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text + icon
      ctx.save();
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "white";
      ctx.font = `bold ${Math.max(11, 16 - slices.length)}px Montserrat, sans-serif`;
      ctx.fillText(slice.icon + " " + slice.label, radius - 14, 5);
      ctx.restore();
    });

    ctx.restore();

    // Center circle
    ctx.beginPath();
    ctx.arc(center, center, 22, 0, 2 * Math.PI);
    ctx.fillStyle = "hsl(230 20% 7%)";
    ctx.fill();
    ctx.strokeStyle = "hsl(245 60% 55%)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = "white";
    ctx.font = "bold 16px Montserrat";
    ctx.textAlign = "center";
    ctx.fillText("🎯", center, center + 6);
  };

  const spin = () => {
    if (spinning || slices.length === 0) return;
    setSpinning(true);
    setResult(null);

    // Weighted random
    const totalProb = slices.reduce((s, sl) => s + sl.probability, 0);
    let rand = Math.random() * totalProb;
    let winnerIndex = 0;
    for (let i = 0; i < slices.length; i++) {
      rand -= slices[i].probability;
      if (rand <= 0) { winnerIndex = i; break; }
    }

    const arc = 360 / slices.length;
    const targetAngle = 360 - (winnerIndex * arc + arc / 2);
    const totalRotation = 360 * 6 + targetAngle; // 6 full spins + target
    const finalRot = rotation + totalRotation;

    setRotation(finalRot);

    // Animate canvas
    const start = performance.now();
    const duration = 5000;
    const startRot = rotation;

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentRot = startRot + totalRotation * eased;
      drawWheel(currentRot);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setSpinning(false);
        setResult(slices[winnerIndex]);
      }
    };

    requestAnimationFrame(animate);
  };

  const getPrizeText = (slice: Slice) => {
    if (slice.discount_percent) return `${slice.discount_percent}% de desconto`;
    if (slice.discount_value) return `R$ ${Number(slice.discount_value).toFixed(2)} de desconto`;
    if (slice.custom_prize) return slice.custom_prize;
    return slice.label;
  };

  if (slices.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      style={{ background: "hsl(0 0% 0% / 0.75)", backdropFilter: "blur(12px)" }}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="glass-card-strong w-full max-w-sm p-5 flex flex-col items-center gap-4 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg" style={{ background: "hsl(0 0% 100% / 0.05)" }}>
          <X className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-accent" />
          <h2 className="text-lg font-bold text-foreground">Roleta Premiada</h2>
        </div>
        <p className="text-xs text-muted-foreground text-center">Gire e ganhe um prêmio especial!</p>

        {/* Wheel */}
        <div className="relative">
          {/* Arrow pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
            <div className="w-0 h-0" style={{
              borderLeft: "10px solid transparent",
              borderRight: "10px solid transparent",
              borderTop: "18px solid hsl(245 60% 55%)",
              filter: "drop-shadow(0 2px 4px hsl(0 0% 0% / 0.5))",
            }} />
          </div>
          <canvas
            ref={canvasRef}
            width={280}
            height={280}
            className="rounded-full"
            style={{ filter: "drop-shadow(0 8px 24px hsl(245 60% 55% / 0.2))" }}
          />
        </div>

        {!result ? (
          <button
            onClick={spin}
            disabled={spinning}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all uppercase tracking-wider flex items-center justify-center gap-2"
            style={{
              background: spinning ? "hsl(0 0% 100% / 0.05)" : "hsl(245 60% 55%)",
              color: spinning ? "hsl(0 0% 50%)" : "white",
            }}
          >
            {spinning ? (
              <>
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "hsl(0 0% 50%)", borderTopColor: "transparent" }} />
                Girando...
              </>
            ) : "🎰 Girar Roleta"}
          </button>
        ) : (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full text-center space-y-3"
          >
            <div className="text-4xl mb-1">🎉</div>
            <h3 className="text-lg font-bold text-foreground">Parabéns!</h3>
            <p className="text-sm text-muted-foreground">Você ganhou:</p>
            <div className="py-3 px-4 rounded-xl" style={{ background: "hsl(245 60% 55% / 0.1)", border: "1px solid hsl(245 60% 55% / 0.2)" }}>
              <p className="text-base font-bold" style={{ color: "hsl(245 60% 70%)" }}>
                {result.icon} {getPrizeText(result)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: "hsl(245 60% 55%)", color: "white" }}
            >
              Aproveitar!
            </button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PrizeWheel;
