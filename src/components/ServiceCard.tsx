import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";
import type { Service } from "@/data/services";

interface ServiceCardProps {
  service: Service;
  onSelect: (service: Service) => void;
  index: number;
}

const ServiceCard = ({ service, onSelect, index }: ServiceCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="glass-card hover-lift cursor-pointer group overflow-hidden"
      onClick={() => onSelect(service)}
    >
      <div className="flex items-stretch">
        {/* Image */}
        <div className="w-24 sm:w-32 shrink-0 overflow-hidden rounded-l-2xl relative">
          <img
            src={service.image}
            alt={service.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/40" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 px-3 py-3 sm:p-4 flex flex-col justify-between gap-2">
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-bold text-foreground tracking-tight leading-snug truncate">
              {service.title}
            </h3>
            <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 leading-relaxed truncate">
              {service.subtitle}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="gold-text text-base sm:text-lg font-bold whitespace-nowrap">
              R$ {service.price}
            </span>
            <span className="flex items-center gap-0.5 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
              <Clock className="w-3 h-3" />
              {service.duration}
            </span>
            <button
              className="ml-auto flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 text-[11px] sm:text-xs whitespace-nowrap rounded-lg sm:rounded-xl font-semibold transition-all duration-300 shrink-0"
              style={{ background: 'hsl(0 0% 12%)', color: 'hsl(0 0% 65%)', border: '1px solid hsl(0 0% 18%)' }}
            >
              Agendar <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCard;
