const carouselText = [
  { text: 'creative thinker', color: 'white' },
  { text: 'go-to-market strategist', color: 'white' },
  { text: 'digital marketing expert', color: 'white' },
];

$(document).ready(async function () {
  carousel(carouselText, '#feature-text');
});

async function typeSentence(sentence, eleRef, delay = 100) {
  const letters = sentence.split('');
  let i = 0;
  while (i < letters.length) {
    await waitForMs(delay);
    $(eleRef).append(letters[i]);
    i++;
  }
  return;
}

async function deleteSentence(eleRef) {
  const sentence = $(eleRef).html();
  const letters = sentence.split('');
  let i = 0;
  while (letters.length > 0) {
    await waitForMs(100);
    letters.pop();
    $(eleRef).html(letters.join(''));
  }
}

async function carousel(carouselList, eleRef) {
  var i = 0;
  while (true) {
    updateFontColor(eleRef, carouselList[i].color);
    await typeSentence(carouselList[i].text, eleRef);
    await waitForMs(1500);
    await deleteSentence(eleRef);
    await waitForMs(500);
    i++;
    if (i >= carouselList.length) {
      i = 0;
    }
  }
}

function updateFontColor(eleRef, color) {
  $(eleRef).css('color', color);
}

function waitForMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function scrollToAnchor(aid) {
  var aTag = $("div[name='" + aid + "']");
  $('html,body').animate({ scrollTop: aTag.offset().top - 50 }, 'slow');
}

$('#about-me').click(function () {
  scrollToAnchor('about');
});

$('#skills').click(function () {
  scrollToAnchor('myskills');
});

$('#portfolio').click(function () {
  scrollToAnchor('portfolio');
});
var hash = window.location.hash.substring(1);
if (hash) {
  setTimeout(function () {
    scrollToAnchor(hash);
  }, 1);
}
jQuery(document).ready(function ($) {
  // $('#checkbox').change(function () {
  //   setInterval(function () {
  //     moveRight();
  //   }, 3000);
  // });

  var slideCount = $('#slider ul li').length;
  var slideWidth = $('#slider ul li').width();
  var slideHeight = $('#slider ul li').height();
  var sliderUlWidth = slideCount * slideWidth;

  $('#slider').css({ width: slideWidth, height: slideHeight });

  $('#slider ul').css({ width: sliderUlWidth, marginLeft: -slideWidth });

  $('#slider ul li:last-child').prependTo('#slider ul');

  function moveLeft() {
    $('#slider ul').animate(
      {
        left: +slideWidth,
      },
      200,
      function () {
        $('#slider ul li:last-child').prependTo('#slider ul');
        $('#slider ul').css('left', '');
      }
    );
  }

  function moveRight() {
    $('#slider ul').animate(
      {
        left: -slideWidth,
      },
      200,
      function () {
        $('#slider ul li:first-child').appendTo('#slider ul');
        $('#slider ul').css('left', '');
      }
    );
  }

  $('a.control_prev').click(function () {
    moveLeft();
  });

  $('a.control_next').click(function () {
    moveRight();
  });
});

$('.rocketman').fadeIn('slow', function () {
  // Animation complete
});

//scroll to top button

$(document).ready(function () {
  var scrollTopButton = $('#scrollTopButton');
  //Click event to scroll to top
  $(scrollTopButton).on('click', function () {
    $('html, body').animate(
      {
        scrollTop: 0,
      },
      500
    );
    return false;
  });
});
