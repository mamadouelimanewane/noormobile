interface StarRatingProps {
  value: number;
  onChange?: (v: number) => void;
  size?: number;
}

export default function StarRating({ value, onChange, size = 24 }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          style={{ fontSize: size, lineHeight: 1 }}
          className={`${n <= value ? 'text-noordrive-gold' : 'text-gray-300'} ${onChange ? 'cursor-pointer' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
