import WidgetKit
import SwiftUI

let widgetAppGroup = "group.com.valabji.zikr.widget"
let widgetDataKey = "prayerWidgetData"

struct PrayerEntryData: Codable {
    let name: String
    let time: String
}

struct PrayerWidgetData: Codable {
    let city: String
    let prayers: [PrayerEntryData]
    let updatedAt: String
}

let isoFormatter = ISO8601DateFormatter()

func loadPrayerWidgetData() -> PrayerWidgetData? {
    guard let defaults = UserDefaults(suiteName: widgetAppGroup) else { return nil }
    guard let raw = defaults.string(forKey: widgetDataKey) else { return nil }
    guard let json = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(PrayerWidgetData.self, from: json)
}

struct SimpleEntry: TimelineEntry {
    let date: Date
    let city: String
    let currentPrayer: String?
    let nextPrayer: String?
    let nextPrayerTime: Date?
}

func prayerLabel(_ name: String) -> String {
    switch name {
    case "fajr": return "Fajr"
    case "dhuhr": return "Dhuhr"
    case "asr": return "Asr"
    case "maghrib": return "Maghrib"
    case "isha": return "Isha"
    default: return name.capitalized
    }
}

func buildEntries(from data: PrayerWidgetData?) -> [SimpleEntry] {
    guard let data = data else {
        return [SimpleEntry(date: Date(), city: "", currentPrayer: nil, nextPrayer: nil, nextPrayerTime: nil)]
    }

    let parsed = data.prayers.compactMap { entry -> (String, Date)? in
        guard let date = isoFormatter.date(from: entry.time) else { return nil }
        return (entry.name, date)
    }

    var entries: [SimpleEntry] = []
    for (index, prayer) in parsed.enumerated() {
        let next = index + 1 < parsed.count ? parsed[index + 1] : nil
        entries.append(SimpleEntry(
            date: prayer.1,
            city: data.city,
            currentPrayer: prayer.0,
            nextPrayer: next?.0,
            nextPrayerTime: next?.1
        ))
    }
    return entries.isEmpty
        ? [SimpleEntry(date: Date(), city: data.city, currentPrayer: nil, nextPrayer: nil, nextPrayerTime: nil)]
        : entries
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), city: "", currentPrayer: "fajr", nextPrayer: "dhuhr", nextPrayerTime: Date())
    }

    func getSnapshot(in context: Context, completion: @escaping (SimpleEntry) -> Void) {
        let entries = buildEntries(from: loadPrayerWidgetData())
        completion(entries.first!)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        let entries = buildEntries(from: loadPrayerWidgetData())
        completion(Timeline(entries: entries, policy: .atEnd))
    }
}

struct PrayerWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            if !entry.city.isEmpty {
                Text(entry.city)
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.7))
            }
            if let next = entry.nextPrayer, let nextTime = entry.nextPrayerTime {
                Text(prayerLabel(next))
                    .font(.headline)
                    .foregroundColor(.white)
                Text(nextTime, style: .time)
                    .font(.subheadline)
                    .foregroundColor(.white.opacity(0.9))
            } else {
                Text("Open Zikr to set location")
                    .font(.caption)
                    .foregroundColor(.white)
            }
            if let current = entry.currentPrayer {
                Text("Now: \(prayerLabel(current))")
                    .font(.caption2)
                    .foregroundColor(.white.opacity(0.7))
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding()
        .containerBackground(for: .widget) {
            Color(red: 0.106, green: 0.369, blue: 0.125)
        }
    }
}

struct widgets: Widget {
    let kind: String = "PrayerTimes"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PrayerWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Prayer Times")
        .description("Shows the current and next prayer time.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
