import { IM_Fell_English, Inter, Petit_Formal_Script } from "next/font/google";

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
export const ui = Inter({ subsets: ["latin"], variable: "--font-ui" });
