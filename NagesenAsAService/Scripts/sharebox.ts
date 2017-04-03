declare var _app: {
    roomNumber: number;
    sessionId: string;
    controllerUrl: string;
    twitterHashtagUrl: string;
    apiBaseUrl: string;
    allowDisCoin: boolean;
    isOwner: boolean;
    localize: {
        IfYouLeaveThisPageYouLostCoinsImage: string;
    };
};

module NaaS {

    // "Share" box and QR Code - UI effect
    $(() => {
        $(document).on('click', '.qr-code-icon,.share-box,.modal-mask.active', function (e) {
            e.preventDefault();
            $('.share-box,.modal-mask').toggleClass('active');
            $('.share-box,.modal-mask').fadeToggle();
        });

        $('.share-box #buttonTweet').click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            var text = `投げ銭 as a Service - Room ${_app.roomNumber} に今すぐアクセス☆`;

            var url = _app.apiBaseUrl + '/TwitterShare?';
            url += 'text=' + encodeURIComponent(text);
            url += '&url=' + encodeURIComponent(_app.apiBaseUrl);
            window.open(url);
        });
    });
}