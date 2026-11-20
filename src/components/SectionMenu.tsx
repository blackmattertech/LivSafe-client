import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, FileText } from "lucide-react";

export function SectionMenu({
  sections,
  index,
  saved,
  onPick,
}: {
  sections: { id: string; title: string }[];
  index: number;
  saved: boolean[];
  onPick: (index: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = sections[index];

  useEffect(() => {
    if (!open) return;
    function onPointer(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!current) return null;

  return (
    <div className="intake-jump" ref={wrapRef}>
      <button
        type="button"
        className="intake-jump-trigger"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((value) => !value)}
      >
        <FileText aria-hidden="true" />
        <span>
          {index + 1}. {current.title}
          {saved[index] ? " (saved)" : ""}
        </span>
        <ChevronDown aria-hidden="true" />
      </button>
      {open ? (
        <ul id={listId} className="intake-jump-menu" role="listbox" aria-label="Assessment sections">
          {sections.map((item, itemIndex) => (
            <li key={item.id}>
              <button
                type="button"
                role="option"
                aria-selected={itemIndex === index}
                onClick={() => {
                  setOpen(false);
                  if (itemIndex !== index) onPick(itemIndex);
                }}
              >
                {itemIndex + 1}. {item.title}
                {saved[itemIndex] ? " (saved)" : ""}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
