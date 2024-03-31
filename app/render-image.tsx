import { ImageResponse } from "@vercel/og";
import React, { ReactNode } from "react";
import { Scaffold } from "./components/scaffold";

type SerializedNode =
  | {
      type: string;
      props: Record<string, any> & {
        children: SerializedNode[];
      };
    }
  | (string | number | boolean | null | undefined);

export function deserializeJsx(serialized: SerializedNode[]): JSX.Element {
  // Map over each serialized node and convert it to a React element or a text node
  const elements = serialized.map((node, index) => {
    if (typeof node === "object" && node !== null && "type" in node) {
      // It's an element object with type and props
      const children = node.props.children
        ? deserializeJsx(node.props.children)
        : [];
      const { children: _, ...restProps } = node.props;
      return React.createElement(
        node.type,
        { ...restProps, key: index },
        children
      );
    } else if (node !== null && node !== undefined) {
      // It's a primitive value, so just return it as is (React can render strings and numbers directly)
      return node;
    }
    // Null or undefined children are valid in React and can simply be ignored
    return null;
  });

  // If there's only one top-level node, return it directly, otherwise return the array
  return (elements.length === 1 ? elements[0] : elements) as JSX.Element;
}

export function serializeJsx(children: ReactNode): SerializedNode[] {
  // @ts-expect-error
  return (
    React.Children.map(children, (child) => {
      if (typeof child !== "object" || !child) {
        return child;
      }

      if ("props" in child) {
        let serialized = Object.assign({}, child);
        if (child.props.children) {
          const children = serializeJsx(child.props.children);

          serialized = {
            ...serialized,
            props: {
              ...serialized.props,
              style: {
                ...serialized.props.style,
                // satori requires flex display for multiple children
                display: children.length > 0 ? "flex" : undefined,
              },
              children,
            },
          };
        }

        // If the child is a functional component, evaluate it.
        if (typeof child.type === "function") {
          const evaluatedChild = (child.type as any)(child.props);
          serialized = {
            ...serialized,
            props: {
              ...serialized.props,
              style: {
                ...serialized.props.style,
              },
              children: serializeJsx(evaluatedChild),
            },
          };
        }

        return {
          type: serialized.type,
          props: serialized.props,
          key: serialized.key,
        };
      }
    }) || []
  );
}

/**
 * Constructs JSX tree from JSON object and renders it to a PNG image
 */
export async function renderImage(element: JSX.Element) {
  const response = new ImageResponse(element, {
    width: 1146,
    height: 1146,
  });

  const buffer = await response.arrayBuffer();

  return `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
}

export function imageUrl(image: JSX.Element) {
  const imageJson = JSON.stringify(serializeJsx(image));
  const imageUrl = `${new URL(
    "/images",
    process.env.APP_URL
  ).toString()}?${new URLSearchParams({ jsx: imageJson }).toString()}`;
  return imageUrl;
}
