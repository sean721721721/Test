/* eslint-disable no-console */
/* eslint-disable no-use-before-define */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
// @flow
import * as d3 from 'd3';
import * as science from 'science';
import * as Queue from 'tiny-queue';
import * as reorder from 'reorder.js/index';
import jLouvain from '../jLouvain';

type ArticleObjType = {
  article_id: string,
  article_title: string
};

type UserObjType = {
  id: string,
  community: number,
  repliedArticle: Array<ArticleObjType>
};

type SimilarityObjType = {
  source: string,
  target: string,
  value: number,
  weight?: number
};

type CommunityObjType = {
  id: string,
  community: number
};

type WordObjType = {
  word: string,
  score: number,
  push: number,
  boo: number,
  neutral: number
};

type CommunityWordObjType = {
  community: number,
  wordList: Array<WordObjType>
};

declare type NestedArray<T> = Array<T | NestedArray<T>>;


function computeUserSimilarityByArticles(userAuthorRelationShipArr: Array<UserObjType>): Array<SimilarityObjType> {
  const similarityScale = d3.scaleLinear().domain([0, 2]).range([1, 0]);
  const userListArray = [];
  for (let i = 0; i < userAuthorRelationShipArr.length - 1; i += 1) {
    const temp = userAuthorRelationShipArr[i].repliedArticle;
    for (let j = i + 1; j < userAuthorRelationShipArr.length; j += 1) {
      const next = userAuthorRelationShipArr[j].repliedArticle;
      const tempdiff = temp.filter(
        (o1: ArticleObjType): boolean => next.filter((o2: ArticleObjType): boolean => o2.article_id === o1.article_id).length === 0,
      );
      const nextdiff = next.filter(
        (o1: ArticleObjType): boolean => temp.filter((o2: ArticleObjType): boolean => o2.article_id === o1.article_id).length === 0,
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

function computeArticleSimilarity(userArr: Array<UserObjType>): Array<Array<ArticleObjType>, Array<SimilarityObjType>> {
  const articleArray: Array<ArticleObjType> = [];
  userArr.forEach((u: UserObjType) => {
    u.repliedArticle.forEach((a: ArticleObjType) => {
      const existedArticle = articleArray.find((e: ArticleObjType): boolean => e.article_id === a.article_id);
      if (!existedArticle) {
        articleArray.push({ ...a, userCommuniy: [u.community] });
      } else {
        existedArticle.userCommuniy.push(u.community);
      }
    });
  });
  // use userCommunity
  const array = [];
  for (let i = 0; i < articleArray.length; i += 1) {
    const temp = JSON.parse(JSON.stringify(articleArray[i]));
    for (let j = i + 1; j < articleArray.length; j += 1) {
      const next = JSON.parse(JSON.stringify(articleArray[j]));
      const intersect = [];
      const union = [];
      temp.userCommuniy.forEach((c: number) => {
        const existed = next.userCommuniy.findIndex((e: number): boolean => e === c);
        union.push(c);
        if (existed >= 0) {
          intersect.push(c);
          next.userCommuniy.splice(existed, 1);
        }
      });
      union.push(...next.userCommuniy);
      const sim = intersect.length / union.length;
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

function jLouvainClustering(nodes: Array<string>, edges: Array<SimilarityObjType>): Array<CommunityObjType> | boolean {
  if (!nodes) return false;
  const edgeData = edges.map((e: SimilarityObjType): SimilarityObjType => {
    e.weight = e.value * 10;
    return e;
  });

  // console.log('Input Node Data2', nodes);
  // console.log('Input Edge Data2', edgeData);

  const nodeData3 = [];
  for (let i = 0; i < nodes.length; i += 1) {
    nodeData3.push(i);
  }
  let edgeData3 = [];
  edgeData3 = edges.map((e: SimilarityObjType): SimilarityObjType => {
    const s = nodes.findIndex((d: string): boolean => d === e.source);
    const t = nodes.findIndex((d: string): boolean => d === e.target);
    return { source: s, target: t, weight: e.weight };
  });

  // console.log('Input Node Data3', nodeData3);
  // console.log('Input Edge Data3', edgeData3);

  const community3 = jLouvain().nodes(nodeData3).edges(edgeData3);
  // console.log(community3());
  // Drawing code
  const originalNodeData = d3.entries(nodes);
  // console.log(originalNodeData);

  const forceSimulation = d3.forceSimulation()
    .force('link', d3.forceLink().id(d => d.key));
  forceSimulation
    .nodes(originalNodeData);

  forceSimulation
    .force('link')
    .links(edgeData3);
  // Communnity detection on click event
  const communityAssignmentResult = community3();
  // console.log(originalNodeData);
  // console.log('Resulting Community Data', communityAssignmentResult);
  const final = [];
  const keys = Object.keys(communityAssignmentResult);
  for (let i = 0; i < keys.length; i += 1) {
    final.push({ id: nodes[keys[i]], community: communityAssignmentResult[keys[i]] });
  }
  // console.log('node after clustering', final);
  for (let i = 0; i < 100; i += 1) {
    const countForCom = [];
    for (let j = 0; j < final.length; j += 1) {
      const existed = countForCom.find(e => e.community === final[j].community);
      if (existed) existed.count += 1;
      else countForCom.push({ community: final[j].community, count: 1 });
    }
    console.log(`communityCount: ${countForCom.length} mergeCount: ${i + 1}`);
    if (countForCom.length > 50) {
      const filtered = countForCom.filter(e => e.count <= (i + 1));
      final.forEach((e) => {
        e.community = filtered.some(e1 => e1.community === e.community) ? filtered[0].community : e.community;
      });
    } else {
      break;
    }
  }
  return final;
}

function filterAlwaysNonSimilarUser(ds: Array<UserObjType>, us: Array<string>, sims: Array<SimilarityObjType>, simTh: number, artTh: number): Array<Array<UserObjType>, Array<string>, Array<SimilarityObjType>> {
  let copyDs = ds.filter((e: UserObjType): boolean => e.repliedArticle.length > artTh);
  const copyUsers = ds.map((e: UserObjType): string => e.id);
  const isBelowThreshold = (currentValue: number): boolean => currentValue.value < simTh;
  let removeUnusedSims = sims.filter((e1: SimilarityObjType): boolean => copyUsers.includes(e1.source) && copyUsers.includes(e1.target));
  copyUsers.forEach((e: string) => {
    const filteredSimilarity = removeUnusedSims.filter((e1: SimilarityObjType): boolean => e1.source === e || e1.target === e);
    // console.log(e, filteredSimilarity);
    if (filteredSimilarity.filter((e1: SimilarityObjType): boolean => e1.source !== e1.target).every(isBelowThreshold)) {
    //   console.log('underthreshold');
      removeUnusedSims = removeUnusedSims.filter((e1: SimilarityObjType): boolean => !(e1.source === e || e1.target === e));
      copyDs = copyDs.filter((e1: string): boolean => e1.id !== e);
      copyDs = copyDs.filter((e1: string): boolean => e1 !== e);
    }
  });
  const filteredDs = copyDs;
  const filteredUs = filteredDs.map((e: UserObjType): string => e.id);
  const filteredSim = removeUnusedSims.filter((e: SimilarityObjType): boolean => filteredDs.some((e1: UserObjType): boolean => e1.id === e.source) && filteredDs.some((e1: UserObjType): boolean => e1.id === e.target));
  return [filteredDs, filteredUs, filteredSim];
}

function computeCommunityTitleWordScore(userList: Array<UserObjType>): Array<CommunityWordObjType> {
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
    usr.titleWordScore.every((e: {word: string, score: number}, index: number): boolean => {
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

function relationToMatrix(sim: SimilarityObjType, us: Array<string>): NestedArray<number> {
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

function matrixReordering(mat: NestedArray<number>, origMat: NestedArray<number>, userAxis: Array<string>, us: Array<string>, com: CommunityObjType): NestedArray<number> {
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
  for (let i = 0; i < originalMat.length; i += 1) {
    for (let j = 0; j < originalMat.length; j += 1) {
      const val = JSON.parse(JSON.stringify(originalMat[i][j]));
      const iCom = com.find(e => e.id === userAxis[i]).community;
      const jCom = com.find(e => e.id === userAxis[j]).community;
      const matCom = iCom === jCom ? iCom + 1 : 0;
      originalMat[i][j] = { com: matCom, value: val };
    }
  }
  return [permutedMat, originalMat];
}

function testMatrixReordering(objmat: NestedArray<number>): NestedArray<number> {
  const mat = [];
  for (let i = 0; i < objmat.length; i += 1) {
    mat.push([]);
    for (let j = 0; j < objmat[0].length; j += 1) {
      mat[i].push(objmat[i][j].value);
    }
  }
  console.log(mat);
  const gra = reorder.mat2graph(mat);
  const perm = reorder.pca_order(mat);
  console.log(perm);
  let permutedMat = reorder.permute(objmat, perm);
  permutedMat = reorder.transpose(permutedMat);
  permutedMat = reorder.permute(permutedMat, perm);
  permutedMat = reorder.transpose(permutedMat);
  return permutedMat;
}

function testRandomMatrixReordering(mat: NestedArray<number>): NestedArray<number> {
  const gra = reorder.mat2graph(mat);
  const perm = [];
  for (let i = 0; i < mat.length; i += 1) {
    perm.push(i);
  }
  // perm[2] = 12;
  // perm[12] = 2;
  // perm[3] = 13;
  // perm[13] = 3;
  // perm[18] = 5;
  // perm[5] = 18;
  randomSort(perm);
  let permutedMat = reorder.permute(mat, perm);
  permutedMat = reorder.transpose(permutedMat);
  permutedMat = reorder.permute(permutedMat, perm);
  permutedMat = reorder.transpose(permutedMat);
  return permutedMat;
  function randomSort(array: Array<number>) {
    array.sort(() => Math.random() - 0.5);
  }
}

function testMatrixReorderingByCommunity(mat: NestedArray<number>): NestedArray<number> {
  const maxCommunity = 3;
  const perm = [];
  const comArr = [];
  for (let i = 0; i < mat.length; i += 1) {
    perm.push(i);
  }
  for (let i = 0; i < mat.length; i += 1) {
    if (!comArr.includes(mat[i][i].com)) comArr.push(mat[i][i].com);
  }
  let index = 0;
  for (let i = 0; i < maxCommunity; i += 1) {
    for (let j = 0; j < mat.length; j += 1) {
      if (comArr[i] === mat[j][j].com) {
        perm[index] = j;
        index += 1;
      }
    }
  }
  console.log(perm);
  //   console.log('community permutation for matrix', perm);
  let permutedMat = reorder.permute(mat, perm);
  permutedMat = reorder.transpose(permutedMat);
  permutedMat = reorder.permute(permutedMat, perm);
  permutedMat = reorder.transpose(permutedMat);
  return permutedMat;
  // return [mat, origMat];
}

function matrixReorderingByCommunity(mat: NestedArray<number>, origMat: NestedArray<number>, com: CommunityObjType, userAxis: Array<string>, us: Array<string>): NestedArray<number> {
  const maxCommunity = Math.max(...com.map(p => p.community)) + 1;
  const perm = [];
  const comArr = [];
  for (let i = 0; i < mat.length; i += 1) {
    perm.push(i);
  } 
  for (let i = 0; i < mat.length; i += 1) {
    if (!comArr.includes(origMat[i][i].com - 1)) comArr.push(origMat[i][i].com - 1);
  }
  let index = 0;
  for (let i = 0; i < maxCommunity; i += 1) {
    for (let j = 0; j < mat.length; j += 1) {
      if (comArr[i] === origMat[j][j].com - 1) {
        perm[index] = j;
        index += 1;
      }
    }
  }
  //   console.log('community permutation for matrix', perm);
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

function communityInnerMatrixReordering(mat: NestedArray<number>, origMat: NestedArray<number>, userAxis: Array<string>, us: Array<string>, communityData: CommunityObjType): NestedArray<number> {
  let copyMat = mat.slice();
  let copyOriginalMat = origMat.slice();
  communityData.forEach((com) => {
    const onlyCommunity = [];
    for (let i = com.index; i < com.index + com.num; i += 1) {
      onlyCommunity.push(mat[i].slice(com.index, com.index + com.num));
    }
    // console.log(onlyCommunity);
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
    // console.log(userAxis);
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
  jLouvainClustering,
  filterAlwaysNonSimilarUser,
  relationToMatrix,
  matrixReordering,
  computeCommunityTitleWordScore,
  matrixReorderingByCommunity,
  communityInnerMatrixReordering,
  testMatrixReordering,
  testRandomMatrixReordering,
  testMatrixReorderingByCommunity,
};
