import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DateRangeForm({ start, end }: { start: string; end: string }) {
  return (
    <form className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">From</label>
        <Input type="date" name="start" defaultValue={start} />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">To</label>
        <Input type="date" name="end" defaultValue={end} />
      </div>
      <Button type="submit" variant="outline">
        Apply
      </Button>
    </form>
  );
}
