declare var _app: {
    roomNumber: number;
    controllerUrl: string;
    twitterHashtagUrl: string;
    apiBaseUrl: string;
};

module NaaS {

    // "Share" box and QR Code - UI effect
    $(() => {
        $(document).on('click', '.modal-mask.active,.share-box', function () {
            $('.share-box,.modal-mask').toggleClass('active');
            $('.modal-mask').fadeToggle();
        });

        $('.share-box #buttonTweet').click(function (e) {
            e.stopPropagation();
            var text = `投げ銭 as a Service - Room ${_app.roomNumber} に今すぐアクセス☆`;
            var url = 'https://twitter.com/share?';
            url += 'text=' + encodeURIComponent(text);
            url += '&url=' + encodeURIComponent(_app.controllerUrl);
            $.get(_app.twitterHashtagUrl)
                .done(data => {
                url += '&hashtags=' + encodeURIComponent((<any>data).twitterHashtag);
                window.open(url, 'tweet');
            });
        });
    });
}