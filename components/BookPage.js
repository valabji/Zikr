import * as React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { textStyles, FONT_FAMILY } from '../constants/Fonts';
import { arabicContentStyle } from '../locales/i18n';
import { SPACING, RADIUS, CONTENT_MAX_WIDTH, withAlpha, webCursor } from '../constants/settingsTokens';
import BookEntry from './BookEntry';

function ChapterName({ chapter, lang, colors, style }) {
  const name = lang === 'ar' ? chapter.ar : (chapter.en || chapter.ar);
  return (
    <Text
      style={lang === 'ar'
        ? arabicContentStyle({ fontFamily: FONT_FAMILY, ...style })
        : [textStyles.subtitle, style]}
      numberOfLines={style && style._lines ? style._lines : undefined}
    >
      {name}
    </Text>
  );
}

function SeparatorPage({ chapter, order, colors, lang }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SPACING.xl }}>
      <View style={{
        width: '100%', maxWidth: 420,
        borderWidth: 1, borderColor: withAlpha(colors.accent, 'border'),
        borderRadius: RADIUS.card, paddingVertical: SPACING.xxl, paddingHorizontal: SPACING.lg,
        alignItems: 'center', backgroundColor: withAlpha(colors.accent, 'hairline'),
      }}>
        <View style={{
          width: 52, height: 52, borderRadius: 26,
          backgroundColor: withAlpha(colors.accent, 'subtle'),
          justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.lg,
        }}>
          <Feather name="bookmark" size={24} color={colors.accent} />
        </View>
        <Text style={[textStyles.caption, { color: colors.accent, letterSpacing: 1, marginBottom: SPACING.sm }]}>
          {order}
        </Text>
        <ChapterName
          chapter={chapter}
          lang={lang}
          colors={colors}
          style={{ fontSize: 26, lineHeight: 44, color: colors.text, textAlign: 'center' }}
        />
      </View>
    </View>
  );
}

function ChapterIndexPage({ chapters, colors, lang, fmtNum, title, onJumpChapter }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[textStyles.header, { color: colors.text, textAlign: 'center', paddingVertical: SPACING.lg }]}>
        {title}
      </Text>
      <ScrollView contentContainerStyle={{ paddingBottom: SPACING.xl }} showsVerticalScrollIndicator={false}>
        {chapters.map((chapter, i) => (
          <TouchableOpacity
            key={chapter.id}
            onPress={() => onJumpChapter(chapter.id)}
            style={[{
              flexDirection: 'row', alignItems: 'center',
              paddingVertical: SPACING.md, paddingHorizontal: SPACING.md,
              borderBottomWidth: 1, borderBottomColor: withAlpha(colors.accent, 'hairline'),
              ...(lang === 'ar' ? { direction: 'rtl' } : null),
            }, webCursor]}
          >
            <View style={{
              minWidth: 30, height: 30, borderRadius: 15, paddingHorizontal: 6,
              backgroundColor: withAlpha(colors.accent, 'hairline'),
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Text style={[textStyles.base, { color: colors.accent, fontSize: 13 }]}>{fmtNum(i + 1)}</Text>
            </View>
            <ChapterName
              chapter={chapter}
              lang={lang}
              colors={colors}
              style={{ flex: 1, marginHorizontal: SPACING.md, fontSize: 17, color: colors.text, _lines: 2 }}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

function ContentPage({ page, colors, fontScale, showTranslation, bookmarkSet, onToggleBookmark, highlightIndex, lang, fmtNum }) {
  return (
    <ScrollView
      contentContainerStyle={{ paddingVertical: SPACING.sm }}
      showsVerticalScrollIndicator={false}
    >
      {page.chapter ? (
        <ChapterName
          chapter={page.chapter}
          lang={lang}
          colors={colors}
          style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: SPACING.sm, _lines: 1 }}
        />
      ) : null}
      {page.entries.map(({ entry, index }, i) => (
        <View
          key={index}
          style={{
            paddingHorizontal: SPACING.md,
            paddingVertical: SPACING.md,
            borderTopWidth: i === 0 ? 0 : 1,
            borderTopColor: withAlpha(colors.accent, 'hairline'),
            backgroundColor: index === highlightIndex ? withAlpha(colors.accent, 'subtle') : 'transparent',
          }}
        >
          <BookEntry
            item={entry}
            index={index}
            colors={colors}
            fontScale={fontScale}
            showTranslation={showTranslation}
            bookmarked={bookmarkSet.has(index)}
            onToggleBookmark={onToggleBookmark}
            fmtNum={fmtNum}
          />
        </View>
      ))}
    </ScrollView>
  );
}

export default function BookPage({
  page, width, height, chapters, colors, fontScale, showTranslation,
  bookmarkSet, onToggleBookmark, onJumpChapter, highlightIndex, lang, fmtNum, indexTitle,
}) {
  let body;
  if (page.type === 'chapterIndex') {
    body = (
      <ChapterIndexPage
        chapters={chapters}
        colors={colors}
        lang={lang}
        fmtNum={fmtNum}
        title={indexTitle}
        onJumpChapter={onJumpChapter}
      />
    );
  } else if (page.type === 'separator') {
    const order = fmtNum(chapters.findIndex((c) => c.id === page.chapter?.id) + 1);
    body = <SeparatorPage chapter={page.chapter} order={order} colors={colors} lang={lang} />;
  } else {
    body = (
      <ContentPage
        page={page}
        colors={colors}
        fontScale={fontScale}
        showTranslation={showTranslation}
        bookmarkSet={bookmarkSet}
        onToggleBookmark={onToggleBookmark}
        highlightIndex={highlightIndex}
        lang={lang}
        fmtNum={fmtNum}
      />
    );
  }
  return (
    <View style={{ width, height }}>
      <View style={{ flex: 1, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center', paddingHorizontal: SPACING.sm }}>
        {body}
      </View>
    </View>
  );
}
