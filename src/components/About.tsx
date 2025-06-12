import React from "react";
import { useWindowSize } from "react-use";
import { Card } from "./Card";
import { MobileBox } from "./MobileBox";
import { Card as ShadcnCard, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IoLockClosedOutline, IoLogoGithub } from "react-icons/io5";
import { MdOutlineWifiOff } from "react-icons/md";
import { ExternalLink } from "lucide-react";

export const About = () => {
  const { width } = useWindowSize();
  const isTablet = width >= 850;
  const TopLevelComponent = 
    isTablet 
      ? ({ children }: {children: React.ReactNode}) => (
          <ShadcnCard className="bg-card/80 shadow-none border-0">
            <CardContent className="p-8">{children}</CardContent>
          </ShadcnCard>
        )
      : ({ children }: {children: React.ReactNode}) => <MobileBox title="About">{children}</MobileBox>;
    
  return (
    <TopLevelComponent>
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">Why Doblar?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Doblar is not an ordinary image converter. All the conversion happens
            right in your browser. In other words, nothing is uploaded to a server,
            it is purely local!
          </p>
        </div>

        <div className={isTablet ? "grid grid-cols-3 gap-6 mt-8" : "space-y-6 mt-8"}>
          <Card
            icon={IoLockClosedOutline}
            title="Secure"
            description={
              <>
                Since the file conversion is local, nothing leaves your device.
                This means you can safely use sensitive files without having to
                worry about someone else being able to access them, because we
                can't. Doblar is purely client side - there isn't even a server
                involved!
              </>
            }
          />

          <Card
            icon={MdOutlineWifiOff}
            title="Works Offline"
            tag="Beta"
            description={
              <>
                If you aren't connected to the Internet, you can still use Doblar!
                Try it out yourself: turn off your WiFi, refresh the page and try
                converting an image! The only catch is you need to make sure
                ImageMagick has been fully fetched before you go offline, but
                once it's fetched, Doblar works offline!
              </>
            }
          />

          <Card
            icon={IoLogoGithub}
            title="Open Source"
            description={
              <>
                Doblar is fully open source. Doblar uses open source software as
                well, so you can truly see Doblar is 100% local.
                <br />
                <br />
                <a
                  className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors duration-200 hover:underline"
                  href="https://github.com/icantcodefyi/doblar"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>GitHub Repository</span>
                  <ExternalLink size={16} />
                </a>
              </>
            }
          />
        </div>
      </div>
    </TopLevelComponent>
  );
};
