var NaaS;
(function (NaaS) {
    // "Share" box and QR Code - UI effect
    $(function () {
        $(document).on('click', '.qr-code-icon,.share-box,.modal-mask.active', function (e) {
            e.preventDefault();
            $('.share-box,.modal-mask').toggleClass('active');
            $('.share-box,.modal-mask').fadeToggle();
        });
        $('.share-box #buttonTweet').click(function (e) {
            e.preventDefault();
            e.stopPropagation();
            var text = "\u6295\u3052\u92AD as a Service - Room " + _app.roomNumber + " \u306B\u4ECA\u3059\u3050\u30A2\u30AF\u30BB\u30B9\u2606";
            var url = _app.apiBaseUrl + '/TwitterShare?';
            url += 'text=' + encodeURIComponent(text);
            url += '&url=' + encodeURIComponent(_app.apiBaseUrl);
            window.open(url);
        });
    });
})(NaaS || (NaaS = {}));
//# sourceMappingURL=sharebox.js.map