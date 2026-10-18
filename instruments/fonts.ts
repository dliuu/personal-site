import { IM_Fell_English, Petit_Formal_Script } from "next/font/google";

// Both faces are on the first screen, so both are preloaded with it. The
// nav's small caps use the system face.
export const fell = IM_Fell_English({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-fell",
});
export const script = Petit_Formal_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});
