import type { ComponentType } from "react";
import { useParams } from "react-router";
import { NotFound } from "@/pages/ComingSoon/ComingSoon";
import { DesignChange } from "./DesignChange";
import { HarnessComparison } from "./HarnessComparison";

const writeUps: Record<string, ComponentType> = {
	"harness-comparison": HarnessComparison,
	"design-change": DesignChange,
};

export function WriteUp() {
	const { slug = "" } = useParams();
	const Page = writeUps[slug] ?? NotFound;
	return <Page />;
}
