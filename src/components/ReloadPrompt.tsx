import React, { useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { Transition } from "@headlessui/react";
import { IoCheckmarkCircle, IoClose } from "react-icons/io5";
import sparkles from "$/assets/svg/sparkles.svg";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const ReloadPrompt: React.FC = () => {
  const [display, setDisplay] = useState(false);
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log("SW Registered: " + r);
    },
    onRegisterError(error) {
      console.log("SW registration error", error);
    },
    onOfflineReady() {
      setDisplay(true);
      setTimeout(() => setDisplay(false), 3000);
    },
    onNeedRefresh() {
      setDisplay(true);
    },
  });

  return (
    <Transition
      show={display}
      leave="transition-opacity duration-200"
      leaveFrom="opacity-100"
      leaveTo="opacity-0"
    >
      <Alert className="bg-card/95 backdrop-blur-sm border shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {offlineReady && <IoCheckmarkCircle className="text-green-500 w-5 h-5" />}
              {needRefresh && (
                <img
                  className="select-none pointer-events-none w-5 h-5"
                  src={sparkles}
                  alt="Update available"
                />
              )}
            </div>
            <AlertDescription className="text-sm font-medium text-foreground">
              {offlineReady && "Doblar is ready to work offline!"}
              {needRefresh && "A new update is ready!"}
            </AlertDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {needRefresh && (
              <Button
                size="sm"
                onClick={() => updateServiceWorker(true)}
                className="h-8 text-xs"
              >
                Update
              </Button>
            )}
            {needRefresh && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDisplay(false)}
                className="h-8 w-8 p-0"
              >
                <IoClose size={16} />
              </Button>
            )}
          </div>
        </div>
      </Alert>
    </Transition>
  );
};
