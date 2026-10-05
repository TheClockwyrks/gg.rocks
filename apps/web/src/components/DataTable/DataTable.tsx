import type { ReactNode } from "react";
import { FigureScroll } from "@/components/Figure/Figure";
import { cx } from "@/utils/cx";
import styles from "./DataTable.module.scss";

export interface DataTableRow {
	key: string;
	/** First cell is the row heading; the rest line up with the columns. */
	cells: ReactNode[];
	tone?: "highlight" | "muted";
}

interface DataTableProps {
	columns: string[];
	rows: DataTableRow[];
}

export function DataTable({ columns, rows }: DataTableProps) {
	return (
		<FigureScroll>
			<table className={styles.table}>
				<thead>
					<tr>
						{columns.map((column) => (
							<th
								key={column}
								scope="col"
								className={styles.heading}
							>
								{column}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row) => (
						<tr
							key={row.key}
							className={cx(styles.row, row.tone && styles[row.tone])}
						>
							{row.cells.map((cell, index) =>
								index === 0 ? (
									<th
										key={index}
										scope="row"
										className={styles.cell}
									>
										{cell}
									</th>
								) : (
									<td
										key={index}
										className={styles.cell}
									>
										{cell}
									</td>
								),
							)}
						</tr>
					))}
				</tbody>
			</table>
		</FigureScroll>
	);
}
