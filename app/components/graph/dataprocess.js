/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
import * as d3 from 'd3';
import * as science from 'science';
import * as Queue from 'tiny-queue';
import * as reorder from 'reorder.js/index';

function computeUserSimilarityByArticles(userAuthorRelationShipArr) {
  const similarityScale = d3.scaleLinear().domain([0, 2]).range([1, 0]);
  // if (userAuthorRelationShipArr[0].titleWordScore) {
  //   const userListArray = [];
  //   for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
  //     const temp = userAuthorRelationShipArr[i].titleWordScore;
  //     const tempTotal = temp.reduce((acc, obj) => acc + obj.score, 0);
  //     for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
  //       const next = userAuthorRelationShipArr[j].titleWordScore;
  //       const searchedWord = [];
  //       let dis = 0;
  //       const nextTotal = next.reduce((acc, obj) => acc + obj.score, 0);
  //       temp.forEach((e, index) => {
  //         if (!searchedWord.includes(e.word)) {
  //           searchedWord.push(e.word);
  //           const sameWord = next.find(e1 => e1.word === e.word);
  //           const nextWordScore = sameWord ? sameWord.score : 0;
  //           dis += Math.sqrt(Math.abs(((e.score / tempTotal) * (e.score / tempTotal)) - ((nextWordScore / nextTotal) * (nextWordScore / nextTotal))));
  //         }
  //       });
  //       next.forEach((e, index) => {
  //         if (!searchedWord.includes(e.word)) {
  //           searchedWord.push(e.word);
  //           const sameWord = temp.find(e1 => e1.word === e.word);
  //           const tempWordScore = sameWord ? sameWord.score : 0;
  //           dis += Math.sqrt(Math.abs(((e.score / nextTotal) * (e.score / nextTotal)) - ((tempWordScore / tempTotal) * (tempWordScore / tempTotal))));
  //         }
  //       });
  //       // const sim = 1 / (1 + (dis));
  //       // console.log(`${userAuthorRelationShipArr[i].id} ${userAuthorRelationShipArr[j].id} dis: ${dis} sim: ${similarityScale(dis)}`);
  //       // console.log(userAuthorRelationShipArr[i].id, userAuthorRelationShipArr[j].id, dis);
  //       userListArray.push({
  //         source: userAuthorRelationShipArr[i].id,
  //         target: userAuthorRelationShipArr[j].id,
  //         value: similarityScale(dis),
  //       });
  //     }
  //   }
  //   return userListArray;
  // }

  const userListArray = [];
  for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
    const temp = userAuthorRelationShipArr[i].repliedArticle;
    for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
      const next = userAuthorRelationShipArr[j].repliedArticle;
      const tempdiff = temp.filter(
        o1 => next.filter(o2 => o2.article_id === o1.article_id).length === 0,
      );
      const nextdiff = next.filter(
        o1 => temp.filter(o2 => o2.article_id === o1.article_id).length === 0,
      );
      const intersectArticles = temp.length - tempdiff.length;
      const nextintersectArticles = next.length - nextdiff.length;
      const sim = intersectArticles / (temp.length + next.length - intersectArticles);
      userListArray.push({
        source: userAuthorRelationShipArr[i].id,
        target: userAuthorRelationShipArr[j].id,
        value: sim,
      });
    }
  }
  return userListArray;
}

function computeArticleSimilarity(userArr) {
  const articleArray = [];
  userArr.forEach((u) => {
    u.repliedArticle.forEach((a) => {
      if (!articleArray.some(e => e.article_id === a.article_id)) {
        articleArray.push(a);
      }
    });
  });
  // console.log(articleArray);
  const array = [];
  for (let i = 0; i < articleArray.length; i += 1) {
    const temp = articleArray[i];
    for (let j = i + 1; j < articleArray.length; j += 1) {
      const next = articleArray[j];
      const intersect = temp.cuttedTitle.filter(c1 => next.cuttedTitle.some(c2 => c2.word === c1.word));
      // console.log(intersect, temp.cuttedTitle, next.cuttedTitle);
      const sim = intersect.length / (temp.cuttedTitle.length + next.cuttedTitle.length - intersect.length);
      if (sim) {
        array.push({
          source: temp.article_id,
          target: next.article_id,
          value: sim,
        });
      }
    }
  }
  return [articleArray, array];
}

function filterAlwaysNonSimilarUser(ds, us, sims, simTh, artTh) {
  let copyDs = ds.filter(e => e.repliedArticle.length > artTh);
  const copyUsers = ds.map(e => e.id);
  const isBelowThreshold = currentValue => currentValue.value < simTh;
  let removeUnusedSims = sims.filter(e1 => copyUsers.includes(e1.source) && copyUsers.includes(e1.target));
  copyUsers.forEach((e) => {
    const filteredSimilarity = removeUnusedSims.filter(e1 => e1.source === e || e1.target === e);
    console.log(e, filteredSimilarity);
    if (filteredSimilarity.filter(e1 => e1.source !== e1.target).every(isBelowThreshold)) {
      console.log('underthreshold');
      removeUnusedSims = removeUnusedSims.filter(e1 => !(e1.source === e || e1.target === e));
      copyDs = copyDs.filter(e1 => e1.id !== e);
      copyDs = copyDs.filter(e1 => e1 !== e);
    }
  });
  const filteredDs = copyDs;
  const filteredUs = filteredDs.map(e => e.id);
  const filteredSim = removeUnusedSims.filter(e => filteredDs.some(e1 => e1.id === e.source) && filteredDs.some(e1 => e1.id === e.target));
  return [filteredDs, filteredUs, filteredSim];
}

function computeCommunityTitleWordScore(userList) {
  if (!userList[0].titleWordScore) return [];
  const communityWordArr = [];
  const comNums = Math.max(...userList.map(e => e.community)) + 1;
  for (let i = 0; i < comNums; i += 1) {
    communityWordArr.push({ community: i, wordList: [] });
  }
  userList.forEach((usr) => {
    // user's communty
    const usrCom = communityWordArr.find(e => e.community === usr.community);
    // user's top-50 words
    const filteredTitleWord = usr.titleWordScore.filter((e, index) => index < 50);
    // total number of words which user has used
    const usrTotalWordCount = filteredTitleWord.reduce((acc, obj) => acc + obj.score, 0);
    // user's replied articles
    const repliedArticles = usr.repliedArticle;
    usr.titleWordScore.every((e, index) => {
      let push = 0;
      let boo = 0;
      let neutral = 0;
      repliedArticles.forEach((art) => {
        if (art.cuttedTitle.some(w => w.word === e.word)) {
          const mes = art.messages.filter(m => m.push_userid === usr.id);
          push += mes.filter(m => m.push_tag === '推').length;
          boo += mes.filter(m => m.push_tag === '噓').length;
          neutral += mes.filter(m => m.push_tag === '→').length;
        }
      });
      const existedWord = usrCom.wordList.find(c => c.word === e.word);
      if (existedWord) {
        existedWord.score += (e.score / usrTotalWordCount);
        existedWord.push += push;
        existedWord.boo += boo;
        existedWord.neutral += neutral;
      } else {
        usrCom.wordList.push({
          word: e.word, score: e.score / usrTotalWordCount, push, boo, neutral,
        });
      }
      return index < (50 - 1);
    });
  });

  // each score divide by the number of the user of the community
  communityWordArr.forEach((e) => {
    const count = userList.filter(usr => usr.community === e.community).length;
    e.wordList.forEach((list) => {
      list.score = Math.round(list.score / count * 1000) / 1000;
      list.push = Math.round(list.push / count * 1000) / 1000;
      list.boo = Math.round(list.boo / count * 1000) / 1000;
      list.neutral = Math.round(list.neutral / count * 1000) / 1000;
    });
  });
  // sort
  communityWordArr.forEach((e) => {
    e.wordList.sort((a, b) => b.score - a.score);
  });
  return communityWordArr;
}

function relationToMatrix(sim, us) {
  const mat = [];
  const origMat = [];
  for (let i = 0; i < us.length; i += 1) {
    mat.push(Array(us.length).fill(1));
    origMat.push(Array(us.length).fill(1));
  }

  sim.forEach((e) => {
    const sourceUserIndex = us.findIndex(u => u === e.source);
    const targetUserIndex = us.findIndex(u => u === e.target);
    mat[sourceUserIndex][targetUserIndex] = e.value;
    mat[targetUserIndex][sourceUserIndex] = e.value;
    origMat[sourceUserIndex][targetUserIndex] = e.value;
    origMat[targetUserIndex][sourceUserIndex] = e.value;
  });

  // console.log('origMat', origMat);
  return [mat, origMat];
}

function matrixReordering(mat, origMat, userAxis, us) {
  // console.log(mat, origMat, userAxis, users);
  for (let i = 0; i < us.length; i += 1) {
    userAxis.push(Array(us.length).fill(''));
  }

  const gra = reorder.mat2graph(mat);
  // const perm = reorder.spectral_order(gra);
  const perm = reorder.pca_order(mat);

  const origGra = reorder.mat2graph(origMat);
  const origPerm = reorder.spectral_order(origGra);

  let tempUser = [...us];
  for (let j = 0; j < us.length; j += 1) {
    userAxis[j] = tempUser[perm[j]];
  }
  tempUser = [...userAxis];
  // console.log(userAxis);
  let permutedMat = reorder.permute(mat, perm);
  permutedMat = reorder.transpose(permutedMat);
  permutedMat = reorder.permute(permutedMat, perm);
  permutedMat = reorder.transpose(permutedMat);

  let originalMat = reorder.permute(origMat, perm);
  originalMat = reorder.transpose(originalMat);
  originalMat = reorder.permute(originalMat, perm);
  originalMat = reorder.transpose(originalMat);

  return [permutedMat, originalMat];
}

function matrixReorderingByCommunity(mat, origMat, com, userAxis, us) {
  const maxCommunity = Math.max(...com.map(p => p.community));
  const perm = [];
  for (let i = 0; i <= maxCommunity; i += 1) {
    // com.forEach((e, index) => {
    //   if (e.community === i) {
    //     const ind = userAxis.findIndex(d => d === e.id);
    //     perm.push(ind);
    //   }
    // });
    for (let j = 0; j < userAxis.length; j += 1) {
      const id = userAxis[j];
      if (com.find(e => e.id === id).community === i) {
        perm.push(j);
      }
    }
  }
  console.log('community permutation for matrix', perm);
  const tempUser = userAxis.slice();
  for (let j = 0; j < us.length; j += 1) {
    userAxis[j] = tempUser[perm[j]];
  }
  let permutedMat = reorder.permute(mat, perm);
  permutedMat = reorder.transpose(permutedMat);
  permutedMat = reorder.permute(permutedMat, perm);
  permutedMat = reorder.transpose(permutedMat);
  let permutedOrigMat = reorder.permute(origMat, perm);
  permutedOrigMat = reorder.transpose(permutedOrigMat);
  permutedOrigMat = reorder.permute(permutedOrigMat, perm);
  permutedOrigMat = reorder.transpose(permutedOrigMat);
  return [permutedMat, permutedOrigMat];
  // return [mat, origMat];
}

function moveNonSimilarUsersToCorner(mat, origMat, groupInd, userAxis, us) {
  const avgSimilarity = [];
  let sortedSimilarty = [];
  for (let i = 0; i < groupInd.length; i += 1) {
    const pos = groupInd[i].index;
    const { num } = groupInd[i];
    let total = 0;
    for (let j = pos; j < pos + num; j += 1) {
      for (let k = j + 1; k < pos + num; k += 1) {
        total += origMat[j][k];
      }
    }
    const avg = total / (num * (num - 1) / 2);
    avgSimilarity.push(avg);

    const totalArr = [];
    for (let j = pos; j < pos + num; j += 1) {
      let t = 0;
      for (let k = pos; k < pos + num; k += 1) {
        t += origMat[j][k];
      }
      totalArr.push({ index: j, total: t });
    }
    totalArr.sort((a, b) => b.total - a.total);
    sortedSimilarty = sortedSimilarty.concat(totalArr);
  }
  const perm = [];
  sortedSimilarty.forEach((e) => { perm.push(e.index); });

  const tempUser = userAxis.slice();
  for (let j = 0; j < us.length; j += 1) {
    userAxis[j] = tempUser[perm[j]];
  }
  let permutedMat = reorder.permute(mat, perm);
  permutedMat = reorder.transpose(permutedMat);
  permutedMat = reorder.permute(permutedMat, perm);
  permutedMat = reorder.transpose(permutedMat);
  let permutedOrigMat = reorder.permute(origMat, perm);
  permutedOrigMat = reorder.transpose(permutedOrigMat);
  permutedOrigMat = reorder.permute(permutedOrigMat, perm);
  permutedOrigMat = reorder.transpose(permutedOrigMat);
  return [permutedMat, permutedOrigMat];
  // return [mat, origMat];
}

function communityInnerMatrixReordering(mat, origMat, userAxis, us, communityData) {
  let copyMat = mat.slice();
  let copyOriginalMat = origMat.slice();
  communityData.forEach((com) => {
    const onlyCommunity = [];
    for (let i = com.index; i < com.index + com.num; i += 1) {
      onlyCommunity.push(mat[i].slice(com.index, com.index + com.num));
    }
    console.log(onlyCommunity);
    const gra = reorder.mat2graph(onlyCommunity);
    // const prePerm = reorder.spectral_order(gra);
    const prePerm = reorder.pca_order(onlyCommunity);
    // const orig_gra = reorder.mat2graph(origMat);
    // const orig_perm = reorder.spectral_order(orig_gra);
    const perm = [];
    for (let i = 0; i < mat.length; i += 1) {
      if (i < com.index || i >= com.index + com.num) {
        perm.push(i);
      } else {
        perm.push(prePerm[i - com.index] + com.index);
      }
    }
    const tempUser = userAxis.slice();
    for (let j = 0; j < us.length; j += 1) {
      userAxis[j] = tempUser[perm[j]];
    }
    console.log(userAxis);
    copyMat = reorder.permute(copyMat, perm);
    copyMat = reorder.transpose(copyMat);
    copyMat = reorder.permute(copyMat, perm);
    copyMat = reorder.transpose(copyMat);
    copyOriginalMat = reorder.permute(copyOriginalMat, perm);
    copyOriginalMat = reorder.transpose(copyOriginalMat);
    copyOriginalMat = reorder.permute(copyOriginalMat, perm);
    copyOriginalMat = reorder.transpose(copyOriginalMat);
  });

  return [copyMat, copyOriginalMat];
}

export {
  computeUserSimilarityByArticles,
  computeArticleSimilarity,
  filterAlwaysNonSimilarUser,
  relationToMatrix,
  matrixReordering,
  computeCommunityTitleWordScore,
  matrixReorderingByCommunity,
  moveNonSimilarUsersToCorner,
  communityInnerMatrixReordering,
};