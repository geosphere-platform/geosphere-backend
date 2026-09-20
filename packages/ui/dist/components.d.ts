import React from "react";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "danger" | "outline";
    size?: "sm" | "md" | "lg";
    isLoading?: boolean;
}
export declare const Button: React.FC<ButtonProps>;
export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}
export declare const Modal: React.FC<ModalProps>;
export declare const Dialog: React.FC<ModalProps>;
export interface FormFieldProps {
    label: string;
    error?: string;
    children: React.ReactNode;
}
export declare const FormField: React.FC<FormFieldProps>;
export interface DataTableColumn<T> {
    key: string;
    header: string;
    render?: (row: T) => React.ReactNode;
}
export interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    keyExtractor: (row: T) => string;
}
export declare function DataTable<T>({ columns, data, keyExtractor }: DataTableProps<T>): React.JSX.Element;
export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}
export declare const Pagination: React.FC<PaginationProps>;
export declare const LoadingState: React.FC<{
    message?: string;
}>;
export declare const EmptyState: React.FC<{
    title: string;
    description?: string;
}>;
export declare const ErrorState: React.FC<{
    message: string;
    onRetry?: () => void;
}>;
export interface ConfirmationDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
}
export declare const ConfirmationDialog: React.FC<ConfirmationDialogProps>;
//# sourceMappingURL=components.d.ts.map