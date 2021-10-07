# `<webtv-audioscope>`

## Purpose

This HTML5 custom element attempts to replicate WebTV's exclusive `<audioscope>` tag.

## Usage

1. Replace all instances of `<audioscope>` with `<webtv-audioscope>` (this step may be made optional in the future)
2. Add `<script src="https://cdn.jsdelivr.net/gh/Sgeo/webtv-audioscope@1.0/webtv-audioscope.js"></script>` to the `<head></head>` of the page
3. Ensure all `<webtv-audioscope>` tags are properly closed.
4. Replace audio on the page, such as `<bgsound>` and `<a>` links to audio files with `<audio>` elements. I suggest using `<audio controls>`. The music may also need to be rendered to .mp3 or other audio format that modern browsers can play. `<webtv-audioscope>` does not yet work with other Web Audio reliant players, this may be added in the future.

## Demos

* [mechtild's Bach Toccata Fugue Wineglass](https://sgeo.github.io/webtv-audioscope/scopeglass-bach.html) ([original](http://wtv-zone.com/mechtild/scopeglass-bach.html))

## Limitations

* Colors may not be 100% accurate, especially when transparency is involved (borders and the pixels above and below the audioscope lines)
* Currently unsupported attributes:
    * align
    * maxlevel
