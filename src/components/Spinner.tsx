// components/Spinner.tsx
import "../styles/components/Spinner.css";
export default function Spinner({ small }: { small?: boolean }) {
  return <div className={small ? "spinner small" : "spinner"} />;
}
