import "./DotLoader.css";

type Props = {
    color: "white" | "primary";
};

export const DotLoader = ({ color }: Props) => {
    return (
        <span className={`dot-loader dot-loader--${color}`}>
            <span className="dot-loader__dot" />
            <span className="dot-loader__dot" />
            <span className="dot-loader__dot" />
        </span>
    );
};
