import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

const CustomTooltip = ({
  content,
  children,
  maxWidth = "max-w-[320px]",
  minWidth,
  fill,
  placement = "top",
}) => {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [transform, setTransform] = useState("");
  const triggerRef = useRef(null);

  const updatePos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const gap = 8;
    if (placement === "left") {
      setPos({ top: rect.top + rect.height / 2, left: rect.left - gap });
      setTransform("translate(-100%, -50%)");
    } else if (placement === "right") {
      setPos({ top: rect.top + rect.height / 2, left: rect.right + gap });
      setTransform("translateY(-50%)");
    } else {
      setPos({ top: rect.top - gap, left: rect.left + rect.width / 2 });
      setTransform("translate(-50%, -100%)");
    }
  };

  const handleMouseEnter = () => {
    setVisible(true);
  };

  const handleMouseLeave = () => setVisible(false);

  useEffect(() => {
    if (visible) {
      updatePos();
      const raf = requestAnimationFrame(updatePos);
      window.addEventListener("scroll", updatePos, true);
      window.addEventListener("resize", updatePos);
      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("scroll", updatePos, true);
        window.removeEventListener("resize", updatePos);
      };
    }
  }, [visible]);

  const isEmpty =
    content == null ||
    content === "" ||
    (typeof content === "string" && (content === "---" || content.trim() === ""));
  if (isEmpty) return children;

  return (
    <>
      <div
        ref={triggerRef}
        className={`cursor-help max-w-full ${fill ? "w-full h-full flex items-stretch" : "inline-flex items-center"}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div
            className={`fixed ${maxWidth} ${minWidth || ""} bg-amber-50/95 backdrop-blur-sm text-pink-950 text-[11px] px-3 py-2 rounded-lg shadow-lg border border-amber-400/70 z-[9999] pointer-events-none`}
            style={{
              top: pos.top,
              left: pos.left,
              transform,
            }}
          >
            <div className="font-normal leading-relaxed break-words text-left">
              {typeof content === "string" ? (
                <span className="whitespace-pre-wrap">{content}</span>
              ) : (
                content
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  );
};

export default CustomTooltip;
