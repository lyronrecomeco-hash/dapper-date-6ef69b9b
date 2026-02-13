import { useState, useEffect } from "react";
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

const PrizeWheel = ({ onClose }: { onClose: () => void }) => {
  const [slices, setSlices] = useState<Slice[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<Slice | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("prize_wheel_slices").select("*").eq("active", true).order("sort_order");
      if (data && data.length > 0) setSlices(data as Slice[]);
    };
    fetch();
  }, []);

  const spin = () => {
    if (spinning || slices.length === 0) return;
    setSpinning(true);
    setResult(null);
    setHighlightedIndex(null);

    // Weighted random
    const totalProb = slices.reduce((s, sl) => s + sl.probability, 0);
    let rand = Math.random() * totalProb;
    let winnerIndex = 0;
    for (let i = 0; i < slices.length; i++) {
      rand -= slices[i].probability;
      if (rand <= 0) { winnerIndex = i; break; }
    }

    // Animate highlight cycling through slices
    const totalCycles = slices.length * 4 + winnerIndex; // 4 full cycles + land on winner
    let step = 0;
    const baseDelay = 60;

    const cycle = () => {
      const currentIdx = step % slices.length;
      setHighlightedIndex(currentIdx);
      step++;

      if (step <= totalCycles) {
        // Ease out: increase delay as we get closer to the end
        const progress = step / totalCycles;
        const delay = baseDelay + progress * progress * 300;
        setTimeout(cycle, delay);
      } else {
        // Done
        setSpinning(false);
        setResult(slices[winnerIndex]);
      }
    };

    cycle();
  };

  const getPrizeText = (slice: Slice) => {
    if (slice.discount_percent) return `${slice.discount_percent}% OFF`;
    if (slice.discount_value) return `R$ ${Number(slice.discount_value).toFixed(2)} OFF`;
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

        {/* Horizontal prize cards grid */}
        <div className="w-full grid grid-cols-3 gap-2">
          {slices.map((slice, i) => (
            <motion.div
              key={slice.id}
              animate={{
                scale: highlightedIndex === i ? 1.08 : 1,
                borderColor: highlightedIndex === i ? "hsl(245 60% 55%)" : "hsl(0 0% 100% / 0.08)",
              }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl text-center"
              style={{
                background: highlightedIndex === i
                  ? "hsl(245 60% 55% / 0.15)"
                  : result && result.id === slice.id
                    ? "hsl(245 60% 55% / 0.2)"
                    : "hsl(0 0% 100% / 0.03)",
                border: `1.5px solid ${
                  highlightedIndex === i
                    ? "hsl(245 60% 55%)"
                    : result && result.id === slice.id
                      ? "hsl(245 60% 55% / 0.5)"
                      : "hsl(0 0% 100% / 0.08)"
                }`,
                boxShadow: highlightedIndex === i ? "0 0 20px hsl(245 60% 55% / 0.3)" : "none",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                style={{
                  background: highlightedIndex === i
                    ? "hsl(245 60% 55% / 0.2)"
                    : "hsl(0 0% 100% / 0.05)",
                }}
              >
                {slice.icon}
              </div>
              <span className="text-[10px] font-bold text-foreground/80 leading-tight">{getPrizeText(slice)}</span>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {result ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full text-center space-y-3"
            >
              <div className="text-3xl">🎉</div>
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
          ) : (
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
                  Sorteando...
                </>
              ) : "🎰 Girar Roleta"}
            </button>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default PrizeWheel;
