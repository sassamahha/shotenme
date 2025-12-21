// app/dashboard/UserBookTable.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pen, Trash } from 'lucide-react';
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
  bookstoreId: string;
};

function commentExcerpt(text: string | null | undefined, max = 80): string {
  if (!text) return '';
  if (text.length <= max) return text;
  return text.slice(0, max) + '…';
}

export default function UserBookTable({ userBooks: initial, bookstoreId }: Props) {
  const [userBooks, setUserBooks] = useState<UserBookItem[]>(initial);
  const [savingOrder, setSavingOrder] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
      body: JSON.stringify({
        userBookIds: items.map((b) => b.id),
        bookstoreId,
      }),
    }).catch(() => {
      // 失敗してもとりあえず UI はそのままにしておく（必要ならエラー表示を足す）
    });
    setSavingOrder(false);
  }

  async function handleDelete(userBookId: string, title: string) {
    if (!confirm(`「${title}」を本棚から削除しますか？`)) {
      return;
    }

    setDeletingId(userBookId);
    try {
      const res = await fetch(`/api/user-books/${userBookId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.message || '削除に失敗しました。');
        return;
      }

      // リストから削除
      setUserBooks((prev) => prev.filter((ub) => ub.id !== userBookId));
    } catch (err) {
      console.error('Delete error:', err);
      alert('削除に失敗しました。');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div
      style={{
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        overflow: 'hidden',
        overflowX: 'auto',
      }}
    >
      <table
        style={{
          width: '100%',
          minWidth: 800,
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
            <th style={{ padding: '10px 12px', minWidth: 200 }}>タイトル</th>
            <th style={{ padding: '10px 12px', width: 220 }}>ASIN</th>
            <th style={{ padding: '10px 12px', minWidth: 200 }}>推薦文</th>
            <th style={{ padding: '10px 12px', width: 100 }}>公開</th>
            <th style={{ padding: '10px 12px', width: 100 }}>操作</th>
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
                          <td style={{ padding: '8px 12px', minWidth: 200 }}>
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
                            <span
                              style={{
                                fontSize: 13,
                                color: ub.isPublic ? '#10b981' : '#6b7280',
                                fontWeight: ub.isPublic ? 600 : 400,
                              }}
                            >
                              {ub.isPublic ? '公開' : '非公開'}
                            </span>
                          </td>
                          <td style={{ padding: '8px 12px' }}>
                            <div
                              style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'center',
                              }}
                            >
                              <Link
                                href={`/dashboard/books/${ub.id}/edit`}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#2563eb',
                                  textDecoration: 'none',
                                  padding: '4px',
                                  borderRadius: 4,
                                  transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#eff6ff';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Pen size={16} />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(ub.id, titleLabel)}
                                disabled={deletingId === ub.id}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'transparent',
                                  border: 'none',
                                  color: deletingId === ub.id ? '#9ca3af' : '#ef4444',
                                  cursor: deletingId === ub.id ? 'not-allowed' : 'pointer',
                                  padding: '4px',
                                  borderRadius: 4,
                                  transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                  if (deletingId !== ub.id) {
                                    e.currentTarget.style.backgroundColor = '#fef2f2';
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                }}
                              >
                                <Trash size={16} />
                              </button>
                            </div>
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
