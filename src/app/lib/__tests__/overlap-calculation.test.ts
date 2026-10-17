import {
  getOverlap,
  calculateOverlaps,
  formatTimeRange,
  isValidTimeRange,
} from "../overlap-utils";

describe("getOverlap", () => {
  it("returns null when blocks are on different days", () => {
    const block1 = { day: "2026-10-15", start_time: "09:00", end_time: "12:00" };
    const block2 = { day: "2026-10-16", start_time: "09:00", end_time: "12:00" };

    expect(getOverlap(block1, block2)).toBeNull();
  });

  it("returns null when blocks do not overlap", () => {
    const block1 = { day: "2026-10-15", start_time: "09:00", end_time: "10:00" };
    const block2 = { day: "2026-10-15", start_time: "10:00", end_time: "11:00" };

    expect(getOverlap(block1, block2)).toBeNull();
  });

  it("returns overlap when one block contains another", () => {
    const block1 = { day: "2026-10-15", start_time: "09:00", end_time: "12:00" };
    const block2 = { day: "2026-10-15", start_time: "10:00", end_time: "11:00" };

    const result = getOverlap(block1, block2);
    expect(result).toEqual({
      day: "2026-10-15",
      start: "10:00",
      end: "11:00",
    });
  });

  it("returns overlap when blocks partially overlap", () => {
    const block1 = { day: "2026-10-15", start_time: "09:00", end_time: "11:00" };
    const block2 = { day: "2026-10-15", start_time: "10:00", end_time: "13:00" };

    const result = getOverlap(block1, block2);
    expect(result).toEqual({
      day: "2026-10-15",
      start: "10:00",
      end: "11:00",
    });
  });

  it("returns overlap when blocks touch at endpoints (exclusive)", () => {
    const block1 = { day: "2026-10-15", start_time: "09:00", end_time: "10:00" };
    const block2 = { day: "2026-10-15", start_time: "10:00", end_time: "11:00" };

    // 09:00-10:00 y 10:00-11:00 no se solapan porque el fin de uno es igual al inicio del otro
    expect(getOverlap(block1, block2)).toBeNull();
  });

  it("handles same start time", () => {
    const block1 = { day: "2026-10-15", start_time: "09:00", end_time: "11:00" };
    const block2 = { day: "2026-10-15", start_time: "09:00", end_time: "10:30" };

    const result = getOverlap(block1, block2);
    expect(result).toEqual({
      day: "2026-10-15",
      start: "09:00",
      end: "10:30",
    });
  });

  it("handles same end time", () => {
    const block1 = { day: "2026-10-15", start_time: "09:00", end_time: "10:30" };
    const block2 = { day: "2026-10-15", start_time: "10:00", end_time: "11:00" };

    const result = getOverlap(block1, block2);
    expect(result).toEqual({
      day: "2026-10-15",
      start: "10:00",
      end: "10:30",
    });
  });
});

describe("calculateOverlaps", () => {
  it("returns empty array when no availabilities", () => {
    expect(calculateOverlaps([])).toEqual([]);
  });

  it("returns empty array when only one user has availability", () => {
    const availabilities = [
      { user_id: "user-1", day: "2026-10-15", start_time: "09:00", end_time: "12:00" },
      { user_id: "user-1", day: "2026-10-16", start_time: "14:00", end_time: "16:00" },
    ];

    expect(calculateOverlaps(availabilities)).toEqual([]);
  });

  it("returns overlaps when two users have overlapping blocks", () => {
    const availabilities = [
      { user_id: "user-1", day: "2026-10-15", start_time: "09:00", end_time: "12:00" },
      { user_id: "user-2", day: "2026-10-15", start_time: "10:00", end_time: "14:00" },
    ];

    const overlaps = calculateOverlaps(availabilities);
    expect(overlaps.length).toBe(1);
    expect(overlaps[0]).toEqual({
      day: "2026-10-15",
      start: "10:00",
      end: "12:00",
    });
  });

  it("returns multiple overlaps for multiple days", () => {
    const availabilities = [
      { user_id: "user-1", day: "2026-10-15", start_time: "09:00", end_time: "12:00" },
      { user_id: "user-2", day: "2026-10-15", start_time: "10:00", end_time: "11:00" },
      { user_id: "user-1", day: "2026-10-16", start_time: "14:00", end_time: "17:00" },
      { user_id: "user-2", day: "2026-10-16", start_time: "15:00", end_time: "16:00" },
    ];

    const overlaps = calculateOverlaps(availabilities);
    expect(overlaps.length).toBe(2);
    expect(overlaps[0]).toEqual({ day: "2026-10-15", start: "10:00", end: "11:00" });
    expect(overlaps[1]).toEqual({ day: "2026-10-16", start: "15:00", end: "16:00" });
  });

  it("does not count overlaps between same user", () => {
    const availabilities = [
      { user_id: "user-1", day: "2026-10-15", start_time: "09:00", end_time: "12:00" },
      { user_id: "user-1", day: "2026-10-15", start_time: "10:00", end_time: "11:00" },
    ];

    expect(calculateOverlaps(availabilities)).toEqual([]);
  });

  it("handles three users with overlapping blocks", () => {
    const availabilities = [
      { user_id: "user-1", day: "2026-10-15", start_time: "09:00", end_time: "12:00" },
      { user_id: "user-2", day: "2026-10-15", start_time: "10:00", end_time: "14:00" },
      { user_id: "user-3", day: "2026-10-15", start_time: "11:00", end_time: "13:00" },
    ];

    const overlaps = calculateOverlaps(availabilities);
    // user-1 & user-2: 10:00-12:00
    // user-1 & user-3: 11:00-12:00
    // user-2 & user-3: 11:00-13:00
    expect(overlaps.length).toBe(3);
  });
});

describe("formatTimeRange", () => {
  it("formats time range with en dash", () => {
    expect(formatTimeRange("09:00", "12:00")).toBe("09:00 – 12:00");
  });

  it("handles single digit hours", () => {
    expect(formatTimeRange("09:00", "10:00")).toBe("09:00 – 10:00");
  });
});

describe("isValidTimeRange", () => {
  it("returns true when end is after start", () => {
    expect(isValidTimeRange("09:00", "12:00")).toBe(true);
    expect(isValidTimeRange("08:30", "09:00")).toBe(true);
  });

  it("returns false when end is before start", () => {
    expect(isValidTimeRange("12:00", "09:00")).toBe(false);
    expect(isValidTimeRange("10:00", "10:00")).toBe(false);
  });

  it("returns false when times are equal", () => {
    expect(isValidTimeRange("09:00", "09:00")).toBe(false);
  });
});
