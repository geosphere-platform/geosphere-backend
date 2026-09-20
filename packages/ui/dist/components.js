"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmationDialog = exports.ErrorState = exports.EmptyState = exports.LoadingState = exports.Pagination = exports.FormField = exports.Dialog = exports.Modal = exports.Button = void 0;
exports.DataTable = DataTable;
const react_1 = __importDefault(require("react"));
const Button = ({ children, variant = "primary", size = "md", isLoading = false, disabled, className = "", ...props }) => {
    const baseStyle = "font-medium rounded focus:outline-none transition-colors duration-150";
    const sizeStyles = {
        sm: "px-2.5 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };
    const variantStyles = {
        primary: "bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-300",
        secondary: "bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-300",
        danger: "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-300",
        outline: "border border-gray-300 hover:bg-gray-100 text-gray-700 disabled:bg-gray-50"
    };
    return (react_1.default.createElement("button", { disabled: disabled || isLoading, className: `${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`, ...props }, isLoading ? "Loading..." : children));
};
exports.Button = Button;
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen)
        return null;
    return (react_1.default.createElement("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" },
        react_1.default.createElement("div", { className: "bg-white rounded-lg shadow-xl w-full max-w-md p-6" },
            react_1.default.createElement("div", { className: "flex justify-between items-center pb-3 border-b mb-4" },
                react_1.default.createElement("h3", { className: "text-lg font-bold text-gray-900" }, title),
                react_1.default.createElement("button", { onClick: onClose, className: "text-gray-500 hover:text-gray-700 text-xl font-bold" }, "\u00D7")),
            react_1.default.createElement("div", null, children))));
};
exports.Modal = Modal;
const Dialog = (props) => react_1.default.createElement(exports.Modal, { ...props });
exports.Dialog = Dialog;
const FormField = ({ label, error, children }) => (react_1.default.createElement("div", { className: "mb-4" },
    react_1.default.createElement("label", { className: "block text-sm font-medium text-gray-700 mb-1" }, label),
    children,
    error && react_1.default.createElement("p", { className: "mt-1 text-xs text-red-600" }, error)));
exports.FormField = FormField;
function DataTable({ columns, data, keyExtractor }) {
    return (react_1.default.createElement("div", { className: "overflow-x-auto border border-gray-200 rounded-lg" },
        react_1.default.createElement("table", { className: "min-w-full divide-y divide-gray-200" },
            react_1.default.createElement("thead", { className: "bg-gray-50" },
                react_1.default.createElement("tr", null, columns.map((col) => (react_1.default.createElement("th", { key: col.key, className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" }, col.header))))),
            react_1.default.createElement("tbody", { className: "bg-white divide-y divide-gray-200" }, data.length === 0 ? (react_1.default.createElement("tr", null,
                react_1.default.createElement("td", { colSpan: columns.length, className: "px-6 py-4 text-center text-sm text-gray-500" }, "No data available"))) : (data.map((row) => (react_1.default.createElement("tr", { key: keyExtractor(row) }, columns.map((col) => (react_1.default.createElement("td", { key: col.key, className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900" }, col.render ? col.render(row) : row[col.key])))))))))));
}
const Pagination = ({ currentPage, totalPages, onPageChange }) => (react_1.default.createElement("div", { className: "flex items-center justify-between mt-4" },
    react_1.default.createElement(exports.Button, { variant: "outline", size: "sm", disabled: currentPage <= 1, onClick: () => onPageChange(currentPage - 1) }, "Previous"),
    react_1.default.createElement("span", { className: "text-sm text-gray-700" },
        "Page ",
        currentPage,
        " of ",
        totalPages),
    react_1.default.createElement(exports.Button, { variant: "outline", size: "sm", disabled: currentPage >= totalPages, onClick: () => onPageChange(currentPage + 1) }, "Next")));
exports.Pagination = Pagination;
const LoadingState = ({ message = "Loading..." }) => (react_1.default.createElement("div", { className: "flex flex-col items-center justify-center p-8 text-gray-500" },
    react_1.default.createElement("div", { className: "w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" }),
    react_1.default.createElement("span", { className: "text-sm" }, message)));
exports.LoadingState = LoadingState;
const EmptyState = ({ title, description }) => (react_1.default.createElement("div", { className: "text-center p-8 border-2 border-dashed border-gray-300 rounded-lg" },
    react_1.default.createElement("h4", { className: "text-base font-semibold text-gray-700" }, title),
    description && react_1.default.createElement("p", { className: "text-sm text-gray-500 mt-1" }, description)));
exports.EmptyState = EmptyState;
const ErrorState = ({ message, onRetry }) => (react_1.default.createElement("div", { className: "p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center justify-between" },
    react_1.default.createElement("div", null,
        react_1.default.createElement("h5", { className: "font-semibold text-sm" }, "Error Occurred"),
        react_1.default.createElement("p", { className: "text-xs mt-1" }, message)),
    onRetry && (react_1.default.createElement(exports.Button, { variant: "danger", size: "sm", onClick: onRetry }, "Retry"))));
exports.ErrorState = ErrorState;
const ConfirmationDialog = ({ isOpen, title, message, confirmText = "Confirm", cancelText = "Cancel", onConfirm, onCancel }) => (react_1.default.createElement(exports.Modal, { isOpen: isOpen, onClose: onCancel, title: title },
    react_1.default.createElement("p", { className: "text-sm text-gray-600 mb-6" }, message),
    react_1.default.createElement("div", { className: "flex justify-end gap-3" },
        react_1.default.createElement(exports.Button, { variant: "outline", size: "sm", onClick: onCancel }, cancelText),
        react_1.default.createElement(exports.Button, { variant: "danger", size: "sm", onClick: onConfirm }, confirmText))));
exports.ConfirmationDialog = ConfirmationDialog;
//# sourceMappingURL=components.js.map