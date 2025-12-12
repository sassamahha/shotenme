// app/dashboard/UserBookTable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';

type UserBookItem = {
  id: string;
  sortOrder: number;
  comment: string | null;
  isPublic: boolean;
  book: {
    id: string;
    asin: string;
    title: string;
  };
};

type Props = {
  userBooks: UserBookItem[];
};

function commentExcerpt(text: string | null | undefined, max = 80): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

export default function UserBookTable({ userBooks: initial }: Props) {
  const [userBooks, setUserBooks] = useState<UserBookItem[]>(initial);
  const [savingOrder, setSavingOrder] = useState(false);

  async function handleDragEnd(result: DropResult) {
    if (!result.destination) return;

    const items = Array.from(userBooks);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setUserBooks(items);

    // 並び順をサーバーに保存
    setSavingOrder(true);
    await fetch('/api/user-books/reorder', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userBookIds: items.map((b) => b.id) }),
    }).catch(() => {
      // 失敗してもとりあえず UI はそのままにしておく（必要ならエラー表示を足す）
    });
    setSavingOrder(false);
  }

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
      }}
    >
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: 14,
        }}
      >
        <thead
          style={{
            background: '#f9fafb',
            textAlign: 'left',
          }}
        >
          <tr>
            <th style={{ padding: '10px 12px', width: 40 }}></th>
            <th style={{ padding: '10px 12px' }}>タイトル</th>
            <th style={{ padding: '10px 12px', width: 220 }}>ASIN</th>
            <th style={{ padding: '10px 12px' }}>コメント（抜粋）</th>
            <th style={{ padding: '10px 12px', width: 80 }}>編集</th>
          </tr>
        </thead>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="books">
            {(provided) => (
              <tbody
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {userBooks.map((ub, index) => {
                  const isTitleFallback = ub.book.title === ub.book.asin;
                  const titleLabel = isTitleFallback
                    ? `${ub.book.asin}（タイトル未取得）`
                    : ub.book.title;
                  const comment = commentExcerpt(ub.comment, 80);

                  return (
                    <Draggable
                      key={ub.id}
                      draggableId={ub.id}
                      index={index}
                    >
                      {(provided) => (
                        <tr
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          style={{
                            borderTop: '1px solid #e5e7eb',
                            background: '#fff',
                            ...provided.draggableProps.style,
                          }}
                        >
                          <td
                            style={{
                              padding: '8px 12px',
                              cursor: 'grab',
                              textAlign: 'center',
                              fontSize: 18,
                            }}
                            {...provided.dragHandleProps}
                          >
                            ☰
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            {titleLabel}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              fontFamily: 'monospace',
                            }}
                          >
                            {ub.book.asin}
                          </td>
                          <td
                            style={{
                              padding: '8px 12px',
                              whiteSpace: 'nowrap',
                              textOverflow: 'ellipsis',
                              overflow: 'hidden',
                              maxWidth: 500,
                            }}
                          >
                            {comment}
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <Link
                              href={`/dashboard/books/${ub.id}/edit`}
                              style={{
                                color: '#2563eb',
                                textDecoration: 'none',
                              }}
                            >
                              編集
                            </Link>
                          </td>
                        </tr>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </tbody>
            )}
          </Droppable>
        </DragDropContext>
      </table>

      {savingOrder && (
        <div
          style={{
            padding: 8,
            fontSize: 12,
            color: '#6b7280',
            textAlign: 'right',
          }}
        >
          並び順を保存中…
        </div>
      )}
    </div>
  );
}
