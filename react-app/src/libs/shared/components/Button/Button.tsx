import clsx from "clsx";
import { type MouseEvent as ReactMouseEvent, type ReactNode } from "react";
import { DotLoader } from "../DotLoader/DotLoader";
import "./Button.css";

type Props = {
    className?: string;
    children: ReactNode | string;
    onClick?: (event: ReactMouseEvent<HTMLButtonElement>) => void;
    type: "submit" | "button";
    fullWidth?: boolean;
    title?: string;
    isLoading?: boolean;
    disabled?: boolean;
    buttonStyle: "filled" | "ghost" | "plain";
    tabIndex?: number;
};

export const Button = (props: Props) => {
    const buttonClasses = clsx(
        "button",
        {
            "style-filled": props.buttonStyle === "filled",
            "style-ghost": props.buttonStyle === "ghost",
            "style-plain": props.buttonStyle === "plain",
            "full-width": props.fullWidth,
            "is-loading": props.isLoading,
        },
        props.className
    );

    const loaderColor = props.buttonStyle === "filled" ? "white" : "primary";

    return (
        <button
            className={buttonClasses}
            onClick={props.onClick}
            type={props.type}
            title={props.title}
            disabled={props.disabled}
            tabIndex={props.tabIndex}
        >
            {props.isLoading && <DotLoader color={loaderColor} />}
            <span className="button-text">{props.children}</span>
        </button>
    );
};
