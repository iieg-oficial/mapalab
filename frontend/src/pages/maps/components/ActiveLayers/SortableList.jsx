import React from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, TouchSensor, KeyboardSensor } from '@dnd-kit/core';
import { verticalListSortingStrategy, SortableContext, sortableKeyboardCoordinates, useSortable } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { CSS } from '@dnd-kit/utilities';

const POINTER_SENSOR_OPTIONS = {
    activationConstraint: {
        distance: 5,
    },
};

const TOUCH_SENSOR_OPTIONS = {
    activationConstraint: {
        delay: 250,
        tolerance: 5,
    },
};

const KEYBOARD_SENSOR_OPTIONS = {
    coordinateGetter: sortableKeyboardCoordinates,
};

export const SortableList = ({ items, onSortEnd, children, strategy = verticalListSortingStrategy }) => {
    const sensors = useSensors(
        useSensor(PointerSensor, POINTER_SENSOR_OPTIONS),
        useSensor(TouchSensor, TOUCH_SENSOR_OPTIONS),
        useSensor(KeyboardSensor, KEYBOARD_SENSOR_OPTIONS)
    );

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={onSortEnd}
            modifiers={[restrictToVerticalAxis]}
        >
            <SortableContext
                items={items}
                strategy={strategy}
            >
                {children}
            </SortableContext>
        </DndContext>
    );
};

export function SortableItem(props) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: props.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        zIndex: isDragging ? 999 : 'auto',
    };

    return (
        <div ref={setNodeRef} style={style}>
            {React.Children.map(props.children, child => {
                if (React.isValidElement(child)) {
                    return React.cloneElement(child, {
                        dragHandleProps: { ...attributes, ...listeners },
                        isDragging
                    });
                }
                return child;
            })}
        </div>
    );
}
