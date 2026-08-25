import { useEffect, useState } from "react";
import { LogoLockup } from "@/components/brand/Logo";
import { AnimatePresence, motion } from "framer-motion";

export function SplashLoader() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      // Changed key so it shows up again for testing
      if (sessionStorage.getItem("luxury-splash-v2") !== "seen") {
        setShow(true);
        sessionStorage.setItem("luxury-splash-v2", "seen");
        setTimeout(() => setShow(false), 2200); // Wait 2.2 seconds then fade out
      }
    } catch {
      setShow(false);
    }
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-primary"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="flex flex-col items-center gap-8"
          >
            <div className="brightness-110 drop-shadow-2xl">
               <LogoLockup size={100} stacked />
            </div>
            
            {/* Elegant Loading Bar */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               transition={{ delay: 0.5, duration: 0.8 }}
               className="h-[2px] w-40 overflow-hidden rounded-full bg-primary-foreground/10 relative"
            >
               <motion.div 
                 initial={{ x: "-100%" }}
                 animate={{ x: "100%" }}
                 transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                 className="absolute inset-0 bg-gold-gradient w-1/2 rounded-full"
               />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
