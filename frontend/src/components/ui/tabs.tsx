"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const Tabs = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string, value?: string, onValueChange?: (v: string) => void }
>(({ className, defaultValue, value, onValueChange, children, ...props }, ref) => {
    const [activeTab, setActiveTab] = React.useState(value || defaultValue);

    React.useEffect(() => {
        if (value !== undefined) setActiveTab(value);
    }, [value]);

    const handleTabChange = (val: string) => {
        if (value === undefined) setActiveTab(val);
        if (onValueChange) onValueChange(val);
    }

    // Provide state to children via simple map since this is a lightweight mockup of Radix
    const items = React.Children.map(children, child => {
        if (React.isValidElement(child)) {
            return React.cloneElement(child as any, { activeTab, setActiveTab: handleTabChange });
        }
        return child;
    });

    return (
        <div ref={ref} className={cn("", className)} {...props}>
            {items}
        </div>
    )
})
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "inline-flex h-9 items-center justify-center rounded-lg bg-gray-100 p-1 text-gray-500",
            className
        )}
        {...props}
    />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string; activeTab?: string; setActiveTab?: (v: string) => void }
>(({ className, value, activeTab, setActiveTab, ...props }, ref) => {
    const isActive = activeTab === value;
    return (
        <button
            ref={ref}
            onClick={() => setActiveTab?.(value)}
            className={cn(
                "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                isActive ? "bg-white text-gray-950 shadow" : "hover:text-gray-900",
                className
            )}
            {...props}
        />
    )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string; activeTab?: string }
>(({ className, value, activeTab, ...props }, ref) => {
    if (value !== activeTab) return null;
    return (
        <div
            ref={ref}
            className={cn(
                "mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2",
                className
            )}
            {...props}
        />
    )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
