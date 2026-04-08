type StyleValue = string | number | boolean | null | undefined;

declare namespace p5 {
	class Vector {
		constructor(x?: number, y?: number, z?: number);
		x: number;
		y: number;
		z: number;
		add(value: Vector): this;
		add(x: number, y: number, z?: number): this;
		copy(): Vector;
		div(n: number): this;
		dot(value: Vector): number;
		heading(): number;
		mag(): number;
		magSq(): number;
		mult(n: number): this;
		rotate(angle: number): this;
		set(value: Vector): this;
		set(x: number, y: number, z?: number): this;
		setHeading(angle: number): this;
		setMag(length: number): this;
		sub(value: Vector): this;
		sub(x: number, y: number, z?: number): this;
		static add(v1: Vector, v2: Vector): Vector;
		static cross(v1: Vector, v2: Vector): Vector;
		static dist(v1: Vector, v2: Vector): number;
		static dot(v1: Vector, v2: Vector): number;
		static mult(v: Vector, n: number): Vector;
		static sub(v1: Vector, v2: Vector): Vector;
	}

	class Element {
		elt: HTMLElement;
		attribute(name: string, value: string): this;
		changed(handler: () => void): this;
		mouseClicked(handler: () => void): this;
		parent(parent: Element | HTMLElement | string): this;
		style(property: string, value: StyleValue): this;
	}
}

declare const p5: {
	Vector: typeof p5.Vector;
};

interface P5BaseElement<E extends HTMLElement = HTMLElement> extends p5.Element {
	elt: E;
}

interface P5ButtonElement extends P5BaseElement<HTMLButtonElement> {}

interface P5CanvasElement extends P5BaseElement<HTMLCanvasElement> {}

interface P5CheckboxElement extends P5BaseElement<HTMLLabelElement> {
	checked(): boolean;
	checked(value: boolean): this;
}

interface P5DivElement extends P5BaseElement<HTMLDivElement> {}

interface P5InputElement extends P5BaseElement<HTMLInputElement> {
	size(width: number, height?: number): this;
	value(): string;
	value(value: string): this;
}

interface P5SelectElement extends P5BaseElement<HTMLSelectElement> {
	option(value: string | number): this;
	selected(value: string | number): this;
	value(): string;
	value(value: string | number): this;
}

declare const DEGREES: number;
declare const deltaTime: number;
declare const height: number;
declare const keyIsPressed: boolean;
declare const mouseX: number;
declare const mouseY: number;
declare const width: number;

declare function abs(value: number): number;
declare function angleMode(mode: number): void;
declare function background(color: string): void;
declare function constrain(n: number, low: number, high: number): number;
declare function createButton(label: string): P5ButtonElement;
declare function createCanvas(width?: number, height?: number): P5CanvasElement;
declare function createCheckbox(
	label?: string,
	checked?: boolean,
): P5CheckboxElement;
declare function createDiv(html?: string): P5DivElement;
declare function createInput(value?: string): P5InputElement;
declare function createSelect(): P5SelectElement;
declare function createVector(x?: number, y?: number, z?: number): p5.Vector;
declare function degrees(angle: number): number;
declare function fill(color: string): void;
declare function frameRate(fps: number): void;
declare function line(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
): void;
declare function max(...values: number[]): number;
declare function min(...values: number[]): number;
declare function noFill(): void;
declare function point(x: number, y: number): void;
declare function pop(): void;
declare function push(): void;
declare function radians(angle: number): number;
declare function resizeCanvas(width: number, height: number): void;
declare function rotate(angle: number): void;
declare function round(value: number, decimals?: number): number;
declare function scale(x: number, y?: number): void;
declare function sin(angle: number): number;
declare function sqrt(value: number): number;
declare function stroke(color: string): void;
declare function strokeWeight(weight: number): void;
declare function text(value: string, x: number, y: number): void;
declare function textSize(size: number): void;
declare function translate(vector: p5.Vector): void;
declare function translate(x: number, y: number): void;
declare function triangle(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	x3: number,
	y3: number,
): void;
declare function circle(x: number, y: number, diameter: number): void;
