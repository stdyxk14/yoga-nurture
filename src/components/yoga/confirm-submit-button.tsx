"use client";

import type { ReactNode } from "react";

type Props = {
  message: string;
  className: string;
  children: ReactNode;
};

export function ConfirmSubmitButton({ message, className, children }: Props) {
  return (
    <button
      type="submit"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
      className={className}
    >
      {children}
    </button>
  );
}
