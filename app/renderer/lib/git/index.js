import NodeGit from "nodegit";
import DateFormat from "dateformat";

export async function openRepo(workingDir) {
  return await NodeGit.Repository.open(workingDir)
}

export function loadAllCommits(Repo) {
  if (Repo && window) {
    let walker = NodeGit.Revwalk.create(Repo);
    walker.sorting(NodeGit.Revwalk.SORT.TOPOLOGICAL, NodeGit.Revwalk.SORT.TIME);
    walker.pushGlob('*');
    let stashes = [];
    return NodeGit.Stash.foreach(Repo, (index, msg, id) => {
      stashes.push(id.toString());
      walker.push(id);
    }).then(() => {
      return walker.getCommits(500).then(res => {
        let commits = [];
        let stashIndicies = [];
        res.forEach(x => {
          let stashIndex = -1;
          let isStash = false;
          let parents = x.parents().map(p => p.toString());
          if (stashes.indexOf(x.sha()) !== -1) {
            isStash = true;
            parents = [x.parents()[0].toString()];
            if (x.parents().length > 0) {
              for (let i = 1; i < x.parents().length; i++) {
                stashIndicies.push(x.parents()[i].toString());
              }
            }
            stashIndex = stashes.indexOf(x.sha());
          }
          let cmt = {
            sha: x.sha(),
            sha7: x.sha().substring(0, 6),
            message: x.message().split('\n')[0],
            detail: x.message().split('\n').splice(1, x.message().split('\n').length).join('\n'),
            date: x.date(),
            dateStr: DateFormat(x.date(), "yyyy/mm/dd hh:MM"),
            time: x.time(),
            committer: x.committer(),
            email: x.author().email(),
            author: x.author().name(),
            parents: parents,
            isStash: isStash,
            stashIndex: stashIndex,
          }
          if (stashIndicies.indexOf(cmt.sha) === -1) {
            commits.push(cmt);
          }
        });
        return commits;
      })
    })
  } else {
    return Promise.reject('NO_REPO')
  }
  // return Promise.resolve([
  //   {
  //     sha: '1234',
  //     message: 'change the filange to eradicate the rumbling',
  //   },
  //   { sha: '5678', message: 'fix typos' },
  //   {
  //     sha: '4334',
  //     message:
  //       'add new project type in order to reverse the polarity of the neutron flow',
  //   },
  // ])
}