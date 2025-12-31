import React from "react";
import Header from "./Header";

interface NavbarProps {
  hclass?: string;
  topbarNone?: string;
}

export default function Navbar(props: NavbarProps) {
  const [scroll, setScroll] = React.useState(0);

  const handleScroll = () => setScroll(document.documentElement.scrollTop);

  React.useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const className = scroll > 80 ? "fixed-navbar active" : "fixed-navbar";

  return (
    <div className={className}>
      <Header hclass={props.hclass} topbarNone={props.topbarNone} />
    </div>
  );
}
