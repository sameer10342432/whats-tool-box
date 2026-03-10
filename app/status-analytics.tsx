import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Ionicons } from "@expo/vector-icons";
import { Svg, Circle, G, Rect, Text as SvgText } from "react-native-svg";
import Colors from "@/constants/colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

const TOOLBOX_DIR = (FileSystem.documentDirectory || "") + "WhatsToolbox/";
const STATUSES_DIR =
  "/storage/emulated/0/Android/media/com.whatsapp/WhatsApp/Media/.Statuses/";

const IMAGE_EXTS = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
const VIDEO_EXTS = [".mp4", ".3gp", ".mkv", ".avi"];

type FileInfo = {
  name: string;
  size: number;
  modificationTime: number;
  isImage: boolean;
};

type Analytics = {
  total: number;
  images: number;
  videos: number;
  storageBytes: number;
  byDay: Record<string, number>;
  largest: { name: string; size: number }[];
};

function fmtBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function PieChart({ images, videos }: { images: number; videos: number }) {
  const total = images + videos;
  if (total === 0) return null;
  const imgPct = images / total;
  const vidPct = videos / total;
  const R = 56;
  const cx = 70;
  const cy = 70;
  const circumference = 2 * Math.PI * R;
  const imgDash = circumference * imgPct;
  const vidDash = circumference * vidPct;
  const imgOffset = 0;
  const vidOffset = circumference - imgDash;

  return (
    <View style={styles.chartWrap}>
      <Svg width={140} height={140}>
        <G rotation="-90" origin={`${cx},${cy}`}>
          <Circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke={Colors.primary}
            strokeWidth={20}
            strokeDasharray={`${imgDash} ${circumference - imgDash}`}
            strokeDashoffset={imgOffset}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={R}
            fill="none"
            stroke="#34B7F1"
            strokeWidth={20}
            strokeDasharray={`${vidDash} ${circumference - vidDash}`}
            strokeDashoffset={-imgDash}
          />
        </G>
        <SvgText
          x={cx}
          y={cy - 6}
          textAnchor="middle"
          fill="#888"
          fontSize="11"
          fontWeight="600"
        >
          Total
        </SvgText>
        <SvgText
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fill={Colors.primary}
          fontSize="20"
          fontWeight="700"
        >
          {total}
        </SvgText>
      </Svg>
      <View style={styles.pieLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>
            Images {images} ({Math.round(imgPct * 100)}%)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#34B7F1" }]} />
          <Text style={styles.legendText}>
            Videos {videos} ({Math.round(vidPct * 100)}%)
          </Text>
        </View>
      </View>
    </View>
  );
}

function BarChart({ byDay }: { byDay: Record<string, number> }) {
  const values = DAYS.map((d) => byDay[d] || 0);
  const max = Math.max(...values, 1);
  const barWidth = 30;
  const barGap = 8;
  const chartH = 80;
  const totalW = DAYS.length * (barWidth + barGap) - barGap;

  return (
    <Svg width={totalW} height={chartH + 24}>
      {DAYS.map((day, i) => {
        const val = values[i];
        const barH = Math.max((val / max) * chartH, val > 0 ? 4 : 0);
        const x = i * (barWidth + barGap);
        const y = chartH - barH;
        return (
          <G key={day}>
            <Rect
              x={x}
              y={y}
              width={barWidth}
              height={barH}
              rx={4}
              fill={val > 0 ? Colors.primary : "#E5E7EB"}
              opacity={0.9}
            />
            <SvgText
              x={x + barWidth / 2}
              y={chartH + 14}
              textAnchor="middle"
              fill="#9CA3AF"
              fontSize="10"
            >
              {day}
            </SvgText>
            {val > 0 && (
              <SvgText
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                fill={Colors.primary}
                fontSize="10"
                fontWeight="600"
              >
                {val}
              </SvgText>
            )}
          </G>
        );
      })}
    </Svg>
  );
}

async function scanDir(dir: string): Promise<FileInfo[]> {
  try {
    const info = await FileSystem.getInfoAsync(dir);
    if (!info.exists) return [];
    const items = await FileSystem.readDirectoryAsync(dir);
    const files: FileInfo[] = [];
    for (const name of items) {
      const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
      const isImg = IMAGE_EXTS.includes(ext);
      const isVid = VIDEO_EXTS.includes(ext);
      if (!isImg && !isVid) continue;
      try {
        const fi = await FileSystem.getInfoAsync(dir + name);
        if (fi.exists) {
          files.push({
            name,
            size: (fi as any).size || 0,
            modificationTime: (fi as any).modificationTime || 0,
            isImage: isImg,
          });
        }
      } catch {
        // skip
      }
    }
    return files;
  } catch {
    return [];
  }
}

function computeAnalytics(files: FileInfo[]): Analytics {
  const byDay: Record<string, number> = {};
  let storageBytes = 0;
  let images = 0;
  let videos = 0;
  for (const f of files) {
    storageBytes += f.size;
    if (f.isImage) images++;
    else videos++;
    if (f.modificationTime) {
      const d = new Date(f.modificationTime * 1000);
      const day = DAYS[d.getDay()];
      byDay[day] = (byDay[day] || 0) + 1;
    }
  }
  const largest = [...files]
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)
    .map((f) => ({ name: f.name, size: f.size }));
  return { total: files.length, images, videos, storageBytes, byDay, largest };
}

export default function StatusAnalyticsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const theme = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isWeb] = useState(Platform.OS === "web");

  const load = useCallback(async () => {
    setRefreshing(true);
    const [saved, wa] = await Promise.all([
      scanDir(TOOLBOX_DIR),
      scanDir(STATUSES_DIR),
    ]);
    const all = [...saved, ...wa];
    setAnalytics(computeAnalytics(all));
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: bottomPad + 30 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={load}
          tintColor={Colors.primary}
        />
      }
    >
      {isWeb && (
        <View style={[styles.noteCard, { backgroundColor: isDark ? "#1E1E1E" : "#FFF9E6", borderColor: "#F59E0B" }]}>
          <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
          <Text style={[styles.noteText, { color: theme.textSecondary }]}>
            File scanning is available on Android devices only.
          </Text>
        </View>
      )}

      {/* Summary Cards */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        OVERVIEW
      </Text>
      <View style={styles.statsRow}>
        {[
          { label: "Total Saved", value: analytics?.total ?? 0, icon: "albums", color: Colors.primary },
          { label: "Images", value: analytics?.images ?? 0, icon: "image", color: "#34B7F1" },
          { label: "Videos", value: analytics?.videos ?? 0, icon: "videocam", color: "#7C3AED" },
          { label: "Storage", value: fmtBytes(analytics?.storageBytes ?? 0), icon: "server", color: "#F59E0B" },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: theme.card }]}>
            <View style={[styles.statIcon, { backgroundColor: s.color + "20" }]}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{String(s.value)}</Text>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Pie chart */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>
        IMAGES vs VIDEOS
      </Text>
      <View style={[styles.chartCard, { backgroundColor: theme.card }]}>
        {analytics && (analytics.images > 0 || analytics.videos > 0) ? (
          <PieChart images={analytics.images} videos={analytics.videos} />
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="pie-chart-outline" size={40} color={theme.textSecondary} />
            <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>
              No data yet. Pull down to refresh.
            </Text>
          </View>
        )}
      </View>

      {/* Bar chart */}
      <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>
        ACTIVITY BY DAY
      </Text>
      <View style={[styles.chartCard, { backgroundColor: theme.card, paddingVertical: 20 }]}>
        {analytics && Object.keys(analytics.byDay).length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <BarChart byDay={analytics.byDay} />
          </ScrollView>
        ) : (
          <View style={styles.emptyChart}>
            <Ionicons name="bar-chart-outline" size={40} color={theme.textSecondary} />
            <Text style={[styles.emptyChartText, { color: theme.textSecondary }]}>
              No activity data available.
            </Text>
          </View>
        )}
      </View>

      {/* Largest files */}
      {analytics && analytics.largest.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>
            LARGEST FILES
          </Text>
          <View style={[styles.chartCard, { backgroundColor: theme.card, padding: 0 }]}>
            {analytics.largest.map((f, i) => (
              <View
                key={i}
                style={[
                  styles.fileRow,
                  i < analytics.largest.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.border },
                ]}
              >
                <Ionicons
                  name={f.name.match(/\.(mp4|3gp|mkv)$/i) ? "videocam" : "image"}
                  size={18}
                  color={Colors.primary}
                />
                <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
                  {f.name}
                </Text>
                <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                  {fmtBytes(f.size)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}

      <TouchableOpacity style={styles.refreshBtn} onPress={load} activeOpacity={0.8}>
        <Ionicons name="refresh" size={18} color="#fff" />
        <Text style={styles.refreshBtnText}>Refresh Analytics</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  noteText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 2,
  },
  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "47%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  chartCard: {
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  chartWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  pieLegend: { gap: 8 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: "#9CA3AF", fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyChart: { alignItems: "center", paddingVertical: 20, gap: 8 },
  emptyChartText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  fileName: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  fileSize: { fontSize: 12, fontFamily: "Inter_500Medium" },
  refreshBtn: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 24,
  },
  refreshBtnText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
