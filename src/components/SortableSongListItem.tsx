'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import SongListItem from './SongListItem';

interface SortableSongListItemProps {
  song: any;
  index: number;
  actions: any[];
  itemStyles?: any;
}

export default function SortableSongListItem({ 
  song, 
  index, 
  actions,
  itemStyles = {}
}: SortableSongListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    ...itemStyles
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SongListItem
        song={song}
        index={index}
        showIndex={true}
        isDraggable={true}
        actions={actions}
        dragHandleProps={{ ...attributes, ...listeners }}
        itemStyles={{
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      />
    </div>
  );
}