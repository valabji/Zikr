import WidgetKit
import SwiftUI

let widgetAppGroup = "group.com.valabji.zikr.widget"
let widgetDataKey = "prayerWidgetData"
let widgetThemeKey = "widgetThemeData"
let widgetLanguageKey = "widgetLanguage"

// MARK: - Theme

struct WidgetThemeData: Codable {
    let bg: String
    let text: String
    let textSecondary: String
}

struct WidgetColors {
    let bg: Color
    let text: Color
    let textMuted: Color
}

extension Color {
    init(hex: String) {
        let h = hex.trimmingCharacters(in: CharacterSet(charactersIn: "#"))
        var rgb: UInt64 = 0
        Scanner(string: h).scanHexInt64(&rgb)
        self.init(
            red: Double((rgb >> 16) & 0xFF) / 255,
            green: Double((rgb >> 8) & 0xFF) / 255,
            blue: Double(rgb & 0xFF) / 255
        )
    }
}

func loadWidgetLanguage() -> String {
    if let defaults = UserDefaults(suiteName: widgetAppGroup),
       let lang = defaults.string(forKey: widgetLanguageKey) {
        return lang
    }
    return "en"
}

func loadWidgetColors() -> WidgetColors {
    if let defaults = UserDefaults(suiteName: widgetAppGroup),
       let raw = defaults.string(forKey: widgetThemeKey),
       let json = raw.data(using: .utf8),
       let theme = try? JSONDecoder().decode(WidgetThemeData.self, from: json) {
        return WidgetColors(
            bg: Color(hex: theme.bg),
            text: Color(hex: theme.text),
            textMuted: Color(hex: theme.textSecondary)
        )
    }
    return WidgetColors(
        bg: Color(hex: "#003C34"),
        text: Color(hex: "#FFE29D"),
        textMuted: Color(hex: "#D1955E")
    )
}

// MARK: - Prayer widget data

struct PrayerEntryData: Codable {
    let name: String
    let time: String
}

struct PrayerWidgetData: Codable {
    let city: String
    let prayers: [PrayerEntryData]
    let updatedAt: String
}

struct PrayerItem: Identifiable, Hashable {
    let id: String
    let name: String
    let time: Date
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
    let allPrayers: [PrayerItem]
}

func prayerLabel(_ name: String, lang: String) -> String {
    if lang == "ar" {
        switch name {
        case "fajr": return "الفجر"
        case "dhuhr": return "الظهر"
        case "asr": return "العصر"
        case "maghrib": return "المغرب"
        case "isha": return "العشاء"
        default: return name
        }
    }
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
        return [SimpleEntry(date: Date(), city: "", currentPrayer: nil, nextPrayer: nil, nextPrayerTime: nil, allPrayers: [])]
    }

    let parsed = data.prayers.compactMap { entry -> (String, Date)? in
        guard let date = isoFormatter.date(from: entry.time) else { return nil }
        return (entry.name, date)
    }

    let allPrayers = parsed.prefix(5).enumerated().map { i, p in
        PrayerItem(id: "\(i)-\(p.0)", name: p.0, time: p.1)
    }

    var entries: [SimpleEntry] = []
    for (index, prayer) in parsed.enumerated() {
        let next = index + 1 < parsed.count ? parsed[index + 1] : nil
        entries.append(SimpleEntry(
            date: prayer.1,
            city: data.city,
            currentPrayer: prayer.0,
            nextPrayer: next?.0,
            nextPrayerTime: next?.1,
            allPrayers: allPrayers
        ))
    }
    return entries.isEmpty
        ? [SimpleEntry(date: Date(), city: data.city, currentPrayer: nil, nextPrayer: nil, nextPrayerTime: nil, allPrayers: [])]
        : entries
}

// MARK: - Prayer widget provider

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> SimpleEntry {
        SimpleEntry(date: Date(), city: "", currentPrayer: "fajr", nextPrayer: "dhuhr", nextPrayerTime: Date(), allPrayers: [])
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

// MARK: - Prayer widget views

struct PrayerWidgetEntryView: View {
    var entry: Provider.Entry
    @Environment(\.widgetFamily) var family

    private var c: WidgetColors { loadWidgetColors() }
    private var lang: String { loadWidgetLanguage() }
    private var isArabic: Bool { lang == "ar" }

    var body: some View {
        Group {
            switch family {
            case .systemSmall:
                smallBody
            case .systemLarge:
                largeBody
            default:
                mediumBody
            }
        }
        .containerBackground(for: .widget) { c.bg }
    }

    @ViewBuilder var smallBody: some View {
        VStack(spacing: 4) {
            if let next = entry.nextPrayer, let nextTime = entry.nextPrayerTime {
                Text(prayerLabel(next, lang: lang))
                    .font(.custom("Cairo-Bold", size: 17))
                    .foregroundColor(c.text)
                Text(nextTime, style: .time)
                    .font(.custom("Cairo-Regular", size: 15))
                    .foregroundColor(c.textMuted)
            } else {
                Text(isArabic ? "افتح ذكر" : "Open Zikr")
                    .font(.custom("Cairo-Regular", size: 12))
                    .foregroundColor(c.text)
                    .multilineTextAlignment(.center)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder var mediumBody: some View {
        VStack(alignment: .leading, spacing: 4) {
            if !entry.city.isEmpty {
                Text(entry.city)
                    .font(.custom("Cairo-Regular", size: 11))
                    .foregroundColor(c.textMuted)
            }
            if let next = entry.nextPrayer, let nextTime = entry.nextPrayerTime {
                Text(prayerLabel(next, lang: lang))
                    .font(.custom("Cairo-Bold", size: 17))
                    .foregroundColor(c.text)
                Text(nextTime, style: .time)
                    .font(.custom("Cairo-Regular", size: 15))
                    .foregroundColor(c.text.opacity(0.9))
            } else {
                Text(isArabic ? "افتح ذكر لضبط الموقع" : "Open Zikr to set location")
                    .font(.custom("Cairo-Regular", size: 12))
                    .foregroundColor(c.text)
            }
            if let current = entry.currentPrayer {
                Text("\(isArabic ? "الآن" : "Now"): \(prayerLabel(current, lang: lang))")
                    .font(.custom("Cairo-Regular", size: 11))
                    .foregroundColor(c.textMuted)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .padding()
    }

    @ViewBuilder var largeBody: some View {
        VStack(alignment: .leading, spacing: 10) {
            if !entry.city.isEmpty {
                Text(entry.city)
                    .font(.custom("Cairo-Regular", size: 12))
                    .foregroundColor(c.textMuted)
            }
            ForEach(entry.allPrayers) { prayer in
                let isCurrent = prayer.name == entry.currentPrayer
                HStack {
                    Text(prayerLabel(prayer.name, lang: lang))
                        .font(.custom(isCurrent ? "Cairo-Bold" : "Cairo-Regular", size: 17))
                        .foregroundColor(isCurrent ? c.text : c.textMuted)
                    Spacer()
                    Text(prayer.time, style: .time)
                        .font(.custom(isCurrent ? "Cairo-Bold" : "Cairo-Regular", size: 17))
                        .foregroundColor(isCurrent ? c.text : c.textMuted)
                }
            }
            if entry.allPrayers.isEmpty {
                Text(isArabic ? "افتح ذكر لضبط الموقع" : "Open Zikr to set location")
                    .font(.custom("Cairo-Regular", size: 12))
                    .foregroundColor(c.text)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .padding()
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
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

// MARK: - Hijri calendar widget

private let hijriMonthNamesEn = [
    "Muharram", "Safar", "Rabi' al-Awwal", "Rabi' al-Thani",
    "Jumada al-Awwal", "Jumada al-Thani", "Rajab", "Sha'ban",
    "Ramadan", "Shawwal", "Dhu al-Qi'dah", "Dhu al-Hijjah"
]

private let hijriMonthNamesAr = [
    "محرم", "صفر", "ربيع الأول", "ربيع الثاني",
    "جمادى الأولى", "جمادى الثانية", "رجب", "شعبان",
    "رمضان", "شوال", "ذو القعدة", "ذو الحجة"
]

struct HijriEntry: TimelineEntry {
    let date: Date
    let hijriDay: Int
    let hijriMonth: String
    let hijriYear: Int
    let gregorianLabel: String
}

struct HijriProvider: TimelineProvider {
    func placeholder(in context: Context) -> HijriEntry {
        makeEntry()
    }

    func getSnapshot(in context: Context, completion: @escaping (HijriEntry) -> Void) {
        completion(makeEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<Entry>) -> Void) {
        var components = Calendar.current.dateComponents([.year, .month, .day], from: Date())
        components.day = (components.day ?? 1) + 1
        components.hour = 0
        components.minute = 0
        let nextMidnight = Calendar.current.date(from: components) ?? Date()
        completion(Timeline(entries: [makeEntry()], policy: .after(nextMidnight)))
    }

    private func makeEntry() -> HijriEntry {
        let now = Date()
        let hijriCal = Calendar(identifier: .islamicCivil)
        let comps = hijriCal.dateComponents([.year, .month, .day], from: now)
        let monthIndex = max(0, min((comps.month ?? 1) - 1, 11))
        let monthNames = loadWidgetLanguage() == "ar" ? hijriMonthNamesAr : hijriMonthNamesEn
        let gregCal = Calendar.current
        let gregComps = gregCal.dateComponents([.year, .month, .day], from: now)
        let gregLabel = "\(gregComps.day ?? 1)/\(gregComps.month ?? 1)/\(gregComps.year ?? 2025)"
        return HijriEntry(
            date: now,
            hijriDay: comps.day ?? 1,
            hijriMonth: monthNames[monthIndex],
            hijriYear: comps.year ?? 1446,
            gregorianLabel: gregLabel
        )
    }
}

struct HijriWidgetEntryView: View {
    var entry: HijriProvider.Entry
    @Environment(\.widgetFamily) var family

    private var c: WidgetColors { loadWidgetColors() }
    private var isArabic: Bool { loadWidgetLanguage() == "ar" }

    var body: some View {
        Group {
            if family == .systemSmall {
                smallBody
            } else {
                mediumBody
            }
        }
        .containerBackground(for: .widget) { c.bg }
    }

    @ViewBuilder var smallBody: some View {
        VStack(spacing: 2) {
            Text("\(entry.hijriDay)")
                .font(.custom("Cairo-Bold", size: 36))
                .foregroundColor(c.text)
            Text(entry.hijriMonth)
                .font(.custom("Cairo-Regular", size: 11))
                .foregroundColor(c.textMuted)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    @ViewBuilder var mediumBody: some View {
        VStack(alignment: .center, spacing: 3) {
            Text(isArabic ? "التاريخ الهجري" : "Hijri Date")
                .font(.custom("Cairo-Regular", size: 11))
                .foregroundColor(c.textMuted)
            Text("\(entry.hijriDay) \(entry.hijriMonth)")
                .font(.custom("Cairo-Bold", size: 17))
                .foregroundColor(c.text)
                .multilineTextAlignment(.center)
                .minimumScaleFactor(0.7)
            Text("\(entry.hijriYear) \(isArabic ? "هـ" : "AH")")
                .font(.custom("Cairo-Regular", size: 15))
                .foregroundColor(c.textMuted)
            Text(entry.gregorianLabel)
                .font(.custom("Cairo-Regular", size: 11))
                .foregroundColor(c.textMuted.opacity(0.7))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

struct HijriCalendarWidget: Widget {
    let kind: String = "HijriCalendar"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: HijriProvider()) { entry in
            HijriWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Hijri Calendar")
        .description("Shows today's Hijri (Islamic) date.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}
