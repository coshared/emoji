'use strict';

document.addEventListener('DOMContentLoaded', () => {

    const isSupportedEmoji = (text, size = 16, inMemory = true) => {
        let result;

        const RWJ = '200d';
        text = [...text].filter(s => s.charCodeAt(0).toString(16).toLowerCase() !== RWJ);

        const isSupported = s => {
            let supported = false;
            let canvas = null;
            let ctx = null;

            const paintEmojiInMemory = (s) => {
                // create canvas in memory with native js
                canvas = document.createElement('canvas');
                canvas.setAttribute('width', size + 'px');
                canvas.setAttribute('height', size + 'px');

                !inMemory && document.body.appendChild(canvas);

                ctx = canvas.getContext('2d');

                // set up font
                ctx.textBaseline = 'top';
                ctx.font = size + 'px serif';
                // render text on canvas
                ctx.fillText(s, 0, 0);

                // deallocate memory
                canvas = inMemory && null;
            };

            paintEmojiInMemory(s);

            loop:
                for (let i = 0; i < size; i++) {
                    for (let j = 0; j < size; j++) {

                        let { data } = ctx.getImageData(i, j, 1, 1);
                        data = data.slice(0, 3);

                        if (data.some(part => part !== 0)) {
                            supported = true;
                            break loop;
                        }
                    }
                }

            return supported;
        };

        result = text.every(s => isSupported(s));

        return result;
    };

    // fallback - replace emoji with twemoji-image downloaded from twitter-CDN
    const replaceWithThemoji = (node) => {
        window.twemoji.parse(node.parentNode, {
            className: 'twemoji',
            folder: 'svg',
            ext: '.svg'
        });
    };

    const handleEmoji = (node, supported) => {
        if (!supported) replaceWithThemoji(node);
    };

    let emojiNodes = document.querySelectorAll('.emoji');

    Array.from(emojiNodes).forEach(node => {
        let emojiText = node.innerText.trim();
        let supported = isSupportedEmoji(emojiText);
        console.log(emojiText, supported);
        handleEmoji(node, supported);
    });

    const convertToDashNotation = (name) =>
      name
        .split(' ')
        .join('-')
        .toLowerCase();

    let toDataURL = (url) => {
        return fetch(url).then((response) => {
            return response.blob();
        }).then(blob => {
            return URL.createObjectURL(blob);
        });
    };

    let download = (url, name = 'twemoji.svg') => {
        const a = document.createElement("a");
        toDataURL(url)
            .then(objectUrl => {
                a.href = objectUrl;
                a.download = convertToDashNotation(name) + '.svg';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            })
            .catch(err => { throw  err });
    };

    // handlers
    let form = document.querySelector('#emoji-form');
    form.addEventListener('submit', e => {
        e.preventDefault();
        let formData = new FormData(form);
        let emojiSymbol = formData.get('emoji-symbol');
        let emojiName = formData.get('emoji-name');

        let supported = isSupportedEmoji(emojiSymbol.trim());
        document.querySelector('#emoji-status').innerText = `Этот emoji ${emojiSymbol.trim()} ${supported ? '' : 'НЕ'} поддерживается в вашем браузере`;
        let alias = document.querySelector('#alias');
        alias.innerText = emojiSymbol;
        replaceWithThemoji(alias);
        let twemojiImage = document.querySelector('.twemoji');
        if (!twemojiImage) {
            document.querySelector('#emoji-status').innerText = `Текст не является emoji или этот emoji не может быть найден на внешнем исчтонике!`;
            return false;
        }
        let url = twemojiImage.getAttribute('src');
        download(url, emojiName);
    });
});