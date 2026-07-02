import React, { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export default function MathFormula({ formula, displayMode = false }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode,
          throwOnError: false
        });
      } catch (error) {
        console.error("Error rendering KaTeX formula:", error);
        containerRef.current.textContent = formula;
      }
    }
  }, [formula, displayMode]);

  return <span ref={containerRef} className="katex-formula" />;
}
