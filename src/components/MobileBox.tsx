import React from "react";
import { Disclosure } from "@headlessui/react";
import { IoChevronUpOutline, IoChevronDownOutline } from "react-icons/io5";
import cn from "classnames";

export interface MobileBoxProps {
  title: string;
  panelPadding?: boolean;
}

export const MobileBox: React.FC<MobileBoxProps> = ({ title, children, panelPadding = true }) => {
  return (
    <div className="bg-card min-h-full rounded py-8">
      <Disclosure defaultOpen={true}>
        {({ open }) => (
          <>
            <div className="flex justify-between px-5">
              <h2 className="font-bold text-3xl text-card-foreground">{title}</h2>
              <Disclosure.Button
                title={
                  open ? `Close the ${title} tab` : `Open the ${title} tab`
                }
                className={cn(
                  "order-last rounded border-2 px-2 py-1 border-border text-muted-foreground",
                  "hover:text-foreground hover:bg-accent duration-200 transition-colors"
                )}
              >
                {open ? <IoChevronUpOutline /> : <IoChevronDownOutline />}
              </Disclosure.Button>
            </div>

            <Disclosure.Panel className={cn("mt-5", panelPadding && "px-5")}>{children}</Disclosure.Panel>
          </>
        )}
      </Disclosure>
    </div>
  );
};
