"use client";
import React from "react";
import clsx from "clsx";

type Props = React.PropsWithChildren<{
  as?: React.ElementType;
  className?: string;
  onClick?: () => void;
}>;

export default function Card({
  as: Tag = "div",
  className,
  onClick,
  children,
}: Props) {
  return (
    <Tag
      className={clsx(
        "rounded-lg border border-gray-200 bg-white shadow-sm",
        onClick && "cursor-pointer transition-transform hover:-translate-y-0.5",
        className
      )}
      onClick={onClick}
    >
      {children}
    </Tag>
  );
}
